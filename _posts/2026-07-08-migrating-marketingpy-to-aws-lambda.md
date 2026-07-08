---
layout: post
title: "Migrating marketingPy from Docker Compose to AWS Lambda"
date: 2026-07-08
description: "How a 4-container Docker Compose stack (FastAPI + APScheduler + arq worker + Redis) became three purpose-built Lambda functions behind API Gateway, SQS, and EventBridge Scheduler — and the trick for delayed, self-cleaning email drip schedules."
tags: [aws, lambda, serverless-arch, python, fastapi, sqs, eventbridge, multi-tenant]
categories: [engineering, architecture]
author: your_name
giscus_comments: true
related_posts: true
mermaid:
  enabled: true
  zoomable: true
code_diff: true
toc:
  - name: The Docker Compose Baseline
  - name: Why Move at All
  - name: One Image, Three Entry Points
  - name: Replacing APScheduler with EventBridge
  - name: The Hard Part — Delayed, One-Time Sends
  - name: Replacing arq + Redis with SQS
  - name: Storage Had to Split in Two
  - name: Secrets Without a .env File
  - name: The Cutover
  - name: What I'd Flag Before You Copy This
---

`marketingPy` is the automation service behind [fluxo](https://github.com/) — it polls trends, schedules social posts, scores leads, and runs the email nurture sequences for tenant accounts. It started as four Docker containers on a single EC2 box. This post walks through moving it to three container-image Lambda functions, and the one piece — delayed one-time email sends — that doesn't have an obvious serverless equivalent until you go looking for it.

---

## The Docker Compose Baseline

The original stack was a `docker-compose.yml` with five services:

| Service         | Role                                                                             |
| --------------- | -------------------------------------------------------------------------------- |
| `marketing-api` | FastAPI app, plus an in-process APScheduler running four cron-style jobs         |
| `arq-worker`    | Consumes an async task queue (publish jobs, trend processing, engagement checks) |
| `redis`         | Broker for `arq`, with `--appendonly yes` so queued jobs survived restarts       |
| `db`            | MySQL 8                                                                          |
| `lead-scorer`   | A separate scoring microservice                                                  |

Everything ran on one `t3.medium` EC2 instance behind an ALB — the same shape covered in [Running Maven Builds: From Testing to EC2 Deployment]({% post_url 2026-05-17-mvn-build-test-deploy-ec2 %}), just for a Python service instead of Java. Documented cost for that box alone was roughly $40–80/month, running 24/7 regardless of load.

---

## Why Move at All

The workload doesn't justify a box that's always on:

- The scheduler jobs are a poll every 30 minutes, a calendar check every 5, an hourly analytics pass, and one weekly digest. That's idle most of the second.
- The worker queue is bursty — a flurry of publish/scoring tasks around content creation, then nothing.
- Redis existed purely to give `arq` a broker. It wasn't doing anything else.
- One EC2 instance is also one failure domain. If it goes down, the API, the scheduler, and the worker all go down together.

None of that is a criticism of Compose — it's still the right call for [bookit]({% post_url 2026-03-15-designing-multi-tenant-saas-where-industries-feel-brand %}), which has steadier traffic. For a service that's mostly waiting, pay-per-invocation fits better than pay-per-hour.

---

## One Image, Three Entry Points

Rather than three separate deployable packages, `marketingPy` builds **one** container image and points three Lambda functions at different entry points inside it:

```dockerfile
# Dockerfile.lambda
FROM public.ecr.aws/lambda/python:3.10

COPY requirements-lambda.txt .
RUN pip install --no-cache-dir -r requirements-lambda.txt

COPY . .

# Default entry point — overridden per function in template.yaml
CMD ["lambda_handler.api_handler"]
```

`template.yaml` (AWS SAM) then overrides the command per function:

```yaml
ApiFunction:
  Type: AWS::Serverless::Function
  Properties:
    PackageType: Image
    ImageUri: !Ref EcrImageUri
    ImageConfig:
      Command: ["lambda_handler.api_handler"]
    Timeout: 29 # API Gateway's hard cap is 30s
    ReservedConcurrentExecutions: 5

SchedulerFunction:
  Properties:
    ImageConfig:
      Command: ["lambda_handler.scheduler_handler"]
    Timeout: 300

WorkerFunction:
  Properties:
    ImageConfig:
      Command: ["lambda_handler.worker_handler"]
    Timeout: 300
    ReservedConcurrentExecutions: 3
```

Same dependencies, same code, one build — just three different handler functions in `lambda_handler.py` doing three different jobs:

```python
def api_handler(event: dict, context) -> dict:
    """API Gateway HTTP API → FastAPI via Mangum. All 30+ endpoints work unchanged."""
    _load_secrets()
    from mangum import Mangum
    from main import app
    adapter = Mangum(app, lifespan="off")
    return adapter(event, context)
```

Wrapping the existing FastAPI app in [Mangum](https://mangum.io/) meant every route handler — all 30-plus of them — needed zero changes. The API surface `bookit` calls into is identical; only what's behind it changed.

Container images over zip deployment was the only real option here: `Pillow` needs native image libraries for the visual generator, and packaging those correctly in a zip layer is more fragile than just shipping the whole image through ECR.

Image-level timeout and concurrency limits matter differently per function. `ApiFunction` is capped at 29 seconds because API Gateway itself hangs up at 30 — anything the API does that might run long needs to hand off to the worker instead of blocking a request. `SchedulerFunction` and `WorkerFunction` aren't gated by API Gateway, so they get a full 5 minutes. `ReservedConcurrentExecutions` on `WorkerFunction` (3) exists because the tasks it runs hit rate-limited social platform APIs — more concurrency there just means more 429s, not more throughput.

---

## Replacing APScheduler with EventBridge

`main.py`'s `lifespan` used to start an `AsyncIOScheduler` and register four jobs at boot. That doesn't work in Lambda — there's no long-lived process for APScheduler to run inside. The four jobs moved to EventBridge Scheduler rules that invoke `scheduler_handler` directly:

```yaml
SchedulerFunction:
  Properties:
    Events:
      TrendPoller:
        Type: ScheduleV2
        Properties:
          ScheduleExpression: "rate(30 minutes)"
          Input: '{"job": "trend_poller"}'
      CalendarCheck:
        Type: ScheduleV2
        Properties:
          ScheduleExpression: "rate(5 minutes)"
          Input: '{"job": "calendar_check"}'
      WeeklyDigest:
        Type: ScheduleV2
        Properties:
          ScheduleExpression: "cron(0 9 ? * MON *)"
          Input: '{"job": "weekly_digest"}'
      AnalyticsCollector:
        Type: ScheduleV2
        Properties:
          ScheduleExpression: "rate(1 hour)"
          Input: '{"job": "analytics_collector"}'
```

`scheduler_handler` just dispatches on the `job` key EventBridge passes in:

```python
_SCHEDULER_JOBS = {
    "trend_poller":        "_run_trend_poller",
    "calendar_check":      "_run_calendar_check",
    "weekly_digest":       "_run_weekly_digest",
    "analytics_collector": "_run_analytics_collector",
}

def scheduler_handler(event: dict, context) -> dict:
    _load_secrets()
    job = event.get("job")
    if not job or job not in _SCHEDULER_JOBS:
        return {"status": "error", "job": job}
    import asyncio
    handler_fn = globals()[_SCHEDULER_JOBS[job]]
    asyncio.get_event_loop().run_until_complete(handler_fn())
    return {"status": "ok", "job": job}
```

APScheduler didn't disappear entirely — it's kept for local dev, gated behind an `AWS_LAMBDA_FUNCTION_NAME` check so the same codebase runs identically with `uvicorn` on a laptop and as three Lambda functions in production:

```python
is_lambda = bool(os.getenv("AWS_LAMBDA_FUNCTION_NAME"))
if not is_lambda:
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    scheduler = AsyncIOScheduler()
    scheduler.add_job(poll_all_sources, "interval", minutes=30, id="trend_poller")
    # ...
    scheduler.start()
```

---

## The Hard Part — Delayed, One-Time Sends

The recurring jobs above were the easy 80%. The harder problem: nurture emails need to fire once, at a specific future timestamp, per-recipient — not on a shared cron. The old code used `arq`'s `_defer_by` to push a delayed job onto Redis. There's no Redis anymore.

EventBridge Scheduler turns out to support exactly this — one-time schedules with an `at()` expression, not just recurring `rate()`/`cron()` ones. Each drip step becomes its own disposable schedule that invokes the worker Lambda directly and deletes itself once it fires:

```python
async def _schedule_drip_eventbridge(
    email: str,
    emails_with_delays: list[tuple[int, str, str]],
) -> None:
    scheduler = boto3.client("scheduler", region_name=os.getenv("AWS_REGION", "ca-central-1"))
    worker_arn = os.getenv("WORKER_LAMBDA_ARN", "")
    scheduler_role_arn = os.getenv("SCHEDULER_ROLE_ARN", "")

    safe_email = email.replace("@", "_at_").replace(".", "_")

    for i, (delay_hours, subject, body_html) in enumerate(emails_with_delays):
        fire_at = datetime.now(timezone.utc) + timedelta(hours=delay_hours)
        schedule_name = f"drip-{safe_email}-step{i}"

        payload = json.dumps({
            "task": "task_send_email",
            "args": {"to": email, "subject": subject, "body_html": body_html},
        })

        try:
            scheduler.create_schedule(
                Name=schedule_name,
                GroupName="fluxo-drip",
                ScheduleExpression=f"at({fire_at.strftime('%Y-%m-%dT%H:%M:%S')})",
                ScheduleExpressionTimezone="UTC",
                Target={"Arn": worker_arn, "RoleArn": scheduler_role_arn, "Input": payload},
                ActionAfterCompletion="DELETE",
                FlexibleTimeWindow={"Mode": "FLEXIBLE", "MaximumWindowInMinutes": 15},
            )
        except scheduler.exceptions.ConflictException:
            # Same contact re-enrolled in the sequence — overwrite the existing step
            scheduler.update_schedule(
                Name=schedule_name, GroupName="fluxo-drip",
                ScheduleExpression=f"at({fire_at.strftime('%Y-%m-%dT%H:%M:%S')})",
                ScheduleExpressionTimezone="UTC",
                Target={"Arn": worker_arn, "RoleArn": scheduler_role_arn, "Input": payload},
                ActionAfterCompletion="DELETE",
                FlexibleTimeWindow={"Mode": "FLEXIBLE", "MaximumWindowInMinutes": 15},
            )
```

Three details make this hold up:

- **Deterministic naming** (`drip-{email}-step{n}`) means re-enrolling a contact overwrites their existing pending step instead of stacking duplicate sends — the `ConflictException` branch handles that.
- **`ActionAfterCompletion: DELETE`** means schedules don't accumulate forever. Without it, every contact who ever went through onboarding would leave permanent EventBridge Scheduler entries behind.
- **`FlexibleTimeWindow`** gives EventBridge up to 15 minutes of slack to fire the target, which spreads load instead of every schedule racing to fire at the exact same second.

This pairs with the suppression-list logic from [Part 3 of the SES series]({% post_url 2026-04-15-ses-bounce-complaint-handling %}) — a schedule firing doesn't mean the email should still go out; `task_send_email` still needs to check the recipient isn't suppressed before it sends.

There's a graceful fallback, too: if `WORKER_LAMBDA_ARN` or `SCHEDULER_ROLE_ARN` aren't set (local dev, or a misconfigured environment), it just sends the first email in the sequence immediately instead of silently dropping the rest.

---

## Replacing arq + Redis with SQS

The rest of the task queue — publish jobs, trend processing, engagement checks — moved to SQS, which is simpler than the delayed-send case because these tasks run as soon as possible rather than at a scheduled time:

```yaml
TaskQueue:
  Type: AWS::SQS::Queue
  Properties:
    QueueName: marketing-tasks
    VisibilityTimeout: 360
    RedrivePolicy:
      deadLetterTargetArn: !GetAtt TaskDlq.Arn
      maxReceiveCount: 3

WorkerFunction:
  Properties:
    Events:
      SqsTrigger:
        Type: SQS
        Properties:
          Queue: !GetAtt TaskQueue.Arn
          BatchSize: 1
          FunctionResponseTypes: [ReportBatchItemFailures]
```

`BatchSize: 1` keeps things simple — one message, one task, one success/failure outcome, rather than reasoning about partial batch failures. A message that fails 3 times lands in `TaskDlq` instead of retrying forever:

```python
def worker_handler(event: dict, context) -> dict:
    _load_secrets()
    for record in event.get("Records", []):
        body = json.loads(record["body"])
        task, args = body.get("task"), body.get("args", {})
        try:
            handler_fn = globals()[_TASK_HANDLERS[task]]
            asyncio.get_event_loop().run_until_complete(handler_fn(**args))
        except Exception:
            logger.exception("[worker] Task %s failed", task)
            raise  # re-raise so SQS returns the message for retry
    return {"batchItemFailures": [], "results": results}
```

Letting the exception propagate is what tells SQS to retry the message — swallowing it here would silently drop failed tasks instead of sending them to the DLQ.

---

## Storage Had to Split in Two

Lambda's filesystem is `/tmp`, capped, and gone between cold starts — the app's SQLite files and on-disk brand assets couldn't stay as local files. They split by access pattern rather than moving everything to one place:

**Binary blobs** (brand logos, generated visuals) → S3, with a small shim that keeps the exact same function signatures whether running locally or in Lambda:

```python
IS_LAMBDA = bool(os.getenv("AWS_LAMBDA_FUNCTION_NAME"))

def download_asset(tenant_id: str, filename: str) -> Path | None:
    if not IS_LAMBDA or not S3_BUCKET:
        local = Path(os.getenv("TENANT_ASSETS_DIR", "./data/assets")) / tenant_id / filename
        return local if local.exists() else None

    local = Path("/tmp") / "assets" / tenant_id / filename
    local.parent.mkdir(parents=True, exist_ok=True)
    try:
        boto3.client("s3").download_file(S3_BUCKET, f"assets/{tenant_id}/{filename}", str(local))
        return local
    except Exception:
        return None
```

Every call site (`social_engine/tenant_assets.py`) stayed a one-line change — swap a direct filesystem check for a call into this module — because the branching lives in one place.

**Relational data** moved off the MySQL container to a managed Postgres instance, accessed through `asyncpg` instead of the old `aiosqlite`/MySQL calls. The connection pool is created once per Lambda execution environment and reused across warm invocations, guarded by a lock so concurrent cold-start requests don't race to create two pools:

```python
_pool = None
_pool_lock = asyncio.Lock()

async def get_pool():
    global _pool
    if _pool is not None:
        return _pool
    async with _pool_lock:
        if _pool is not None:
            return _pool
        _pool = await asyncpg.create_pool(
            os.environ["DATABASE_URL"], min_size=1, max_size=5,
            command_timeout=30, ssl="require",
        )
        return _pool
```

`min_size=1, max_size=5` keeps this cheap per Lambda instance — with `ReservedConcurrentExecutions: 5` on the API function, worst case is 5 concurrent Lambda instances each holding up to 5 connections, which is a bound you can actually reason about against your database's connection limit.

Migrating existing data was a one-time script (`scripts/migrate_data_to_s3.py`), run from the still-live EC2 box before cutover — walks the old `data/` directory, uploads SQLite files, tenant assets, and generated visuals into their new S3 prefixes, and skips anything already present so it's safe to re-run.

---

## Secrets Without a .env File

The old stack read a `.env` file mounted into the container. Lambda functions don't have a persistent filesystem to mount a secrets file into, so secrets moved to SSM Parameter Store and get pulled in bulk on cold start:

```python
_secrets_loaded = False

def _load_secrets() -> None:
    global _secrets_loaded
    if _secrets_loaded:
        return
    ssm = boto3.client("ssm", region_name=os.getenv("AWS_REGION", "ca-central-1"))
    paginator = ssm.get_paginator("get_parameters_by_path")
    for page in paginator.paginate(Path="/fluxo/marketing", WithDecryption=True):
        for param in page["Parameters"]:
            key = param["Name"].split("/")[-1]
            os.environ.setdefault(key, param["Value"])
    _secrets_loaded = True
```

The point of `setdefault` and the `_secrets_loaded` module-level flag together: every downstream `os.getenv(...)` call in the rest of the codebase didn't need to change at all, and a warm Lambda instance doesn't re-fetch from SSM on every invocation — only on cold start.

---

## The Cutover

In order:

1. Run `migrate_data_to_s3.py` from the live EC2 box to backfill S3 with existing assets and databases.
2. Load secrets into SSM under `/fluxo/marketing/*`.
3. `sam build && sam deploy --guided` — builds the image, pushes to ECR, stands up the three functions, the SQS queue + DLQ, and the EventBridge Scheduler group.
4. Point `bookit`'s `MARKETING_API_URL` at the new API Gateway URL from the stack output.
5. Stop the old `marketing-api`, `arq-worker`, and `redis` containers.

Each function gets one shared IAM role (`MarketingLambdaRole`) rather than three separate ones — scoped to the S3 bucket, the SSM path prefix, the SQS queue, and `scheduler:CreateSchedule`/`UpdateSchedule`/`DeleteSchedule`. One wrinkle in `template.yaml`: the scheduler's invoke role needs to reference the worker Lambda's ARN, and the Lambda's own role needs `iam:PassRole` on the scheduler's invoke role — a naive `!GetAtt` on either side creates a circular dependency between the two IAM resources. The fix was using `!Sub` with the hardcoded, known function/role names instead of `!GetAtt`, since SAM can resolve a `Sub` string without needing the other resource to exist first.

---

## What I'd Flag Before You Copy This

- **Cold starts matter more here than for a typical CRUD API.** The container image bundles Pillow and other native deps, so first-invocation latency after a period of no traffic is real. Fine for background jobs; worth measuring if you route interactive traffic through the same `ApiFunction`.
- **API Gateway's 29–30s ceiling is a hard constraint**, not a Lambda one — if a request-path operation might run long, it needs to hand off to `WorkerFunction` via SQS rather than trying to raise the API function's timeout past what API Gateway will tolerate.
- **EventBridge Scheduler's one-time schedules are billed and limited per-account** — fine at the volume a single-tenant nurture sequence produces, but if you're enrolling thousands of contacts a day into multi-step sequences, model out the schedule count before assuming this scales the same way a queue would.
- **`ReservedConcurrentExecutions` is a blunt tool.** It protects downstream rate-limited APIs, but it also means requests queue or throttle once you hit the cap — set it from the constraint you're protecting (the social platform's rate limit, the database's connection limit), not an arbitrary number.

The net effect: `marketingPy` now costs whatever it's actually invoked, instead of a flat monthly charge for a box that's mostly idle — and the three-functions-one-image pattern means there's still only one thing to build and deploy.
