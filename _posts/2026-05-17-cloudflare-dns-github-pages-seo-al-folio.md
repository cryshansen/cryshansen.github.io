---
layout: post
title: "Cloudflare DNS + GitHub Pages: Custom Domain and SEO for Your al-folio Site"
date: 2026-05-17
description: "Step-by-step guide to pointing a custom domain at your GitHub Pages site using Cloudflare DNS, and tuning your al-folio Jekyll theme for solid SEO."
tags: [cloudflare, github-pages, dns, seo, al-folio, jekyll]
categories: [devops]
giscus_comments: true
related_posts: false
toc:
  sidebar: left
---

Running an al-folio site on GitHub Pages is a great setup — fast, free, and version-controlled. But by default your site lives at `username.github.io`, which isn't great for branding or SEO. This post walks through connecting a custom domain via Cloudflare DNS, then configuring al-folio's built-in SEO features to make sure search engines actually find and rank your content.

---

## Part 1: Cloudflare DNS Setup

### Prerequisites

- A registered domain (from any registrar — Namecheap, Google Domains, Porkbun, etc.)
- A Cloudflare account (free tier is fine)
- Your al-folio site deployed to GitHub Pages at `username.github.io`

---

### Step 1: Add Your Domain to Cloudflare

1. Log in to [cloudflare.com](https://cloudflare.com) and click **Add a Site**.
2. Enter your domain (e.g. `yourname.com`) and choose the **Free** plan.
3. Cloudflare will scan your existing DNS records. Review them, then continue.
4. Cloudflare will give you two nameserver addresses, something like:
   ```
   aria.ns.cloudflare.com
   bob.ns.cloudflare.com
   ```
5. Go to your domain registrar and **replace the existing nameservers** with Cloudflare's. This step hands DNS control to Cloudflare. Propagation can take up to 24 hours, but is usually much faster.

---

### Step 2: Add DNS Records in Cloudflare

Once your domain is active in Cloudflare, navigate to **DNS → Records** and add the following.

#### A Records (apex domain)

Add four A records pointing your root domain (`@`) to GitHub Pages' IP addresses:

| Type | Name | Content           | Proxy Status |
| :--- | :--- | :---------------- | :----------- |
| A    | `@`  | `185.199.108.153` | DNS only     |
| A    | `@`  | `185.199.109.153` | DNS only     |
| A    | `@`  | `185.199.110.153` | DNS only     |
| A    | `@`  | `185.199.111.153` | DNS only     |

> **Important:** Set Proxy Status to **DNS only** (grey cloud), not Proxied (orange cloud). If you proxy through Cloudflare, GitHub Pages cannot provision a Let's Encrypt SSL certificate for your domain, which you need for the enforced HTTPS option.

#### CNAME Record (www subdomain)

| Type  | Name  | Content              | Proxy Status |
| :---- | :---- | :------------------- | :----------- |
| CNAME | `www` | `username.github.io` | DNS only     |

This lets `www.yourname.com` resolve to your site. Replace `username` with your actual GitHub username.

#### Optional: IPv6 AAAA Records

GitHub Pages also supports IPv6. Adding these is good practice:

| Type | Name | Content               | Proxy Status |
| :--- | :--- | :-------------------- | :----------- |
| AAAA | `@`  | `2606:50c0:8000::153` | DNS only     |
| AAAA | `@`  | `2606:50c0:8001::153` | DNS only     |
| AAAA | `@`  | `2606:50c0:8002::153` | DNS only     |
| AAAA | `@`  | `2606:50c0:8003::153` | DNS only     |

---

### Step 3: Configure the Custom Domain in GitHub

1. In your GitHub repository, go to **Settings → Pages**.
2. Under **Custom domain**, enter your apex domain (e.g. `yourname.com`) and click **Save**.
3. GitHub will create (or update) a `CNAME` file at the root of your repo. Make sure this file is committed and not gitignored. For al-folio sites deployed via GitHub Actions, you may need to add this file manually to your repo root.
4. Wait a few minutes, then check the **Enforce HTTPS** checkbox. If it's greyed out, DNS hasn't fully propagated yet — give it another 10–30 minutes.

#### Verify DNS with `dig`

Once propagation is done, confirm your records are correct:

```bash
# Check A records
dig yourname.com +noall +answer -t A

# Expected output:
# yourname.com. 3600 IN A 185.199.108.153
# yourname.com. 3600 IN A 185.199.109.153
# yourname.com. 3600 IN A 185.199.110.153
# yourname.com. 3600 IN A 185.199.111.153

# Check CNAME for www
dig www.yourname.com +noall +answer -t CNAME
```

---

### Step 4: Update `_config.yml` with Your Custom Domain

Open `_config.yml` in your al-folio repo and update the `url` field:

```yaml
url: https://yourname.com # your custom domain, NOT username.github.io
baseurl: "" # leave empty for apex domains
```

This is important — al-folio uses `url` and `baseurl` to generate canonical URLs, Open Graph tags, and the sitemap. If these are wrong, your SEO metadata will point to the wrong domain.

---

## Part 2: SEO Configuration in al-folio

Al-folio ships with several SEO features built in. Most of them just need the right values in `_config.yml` and your post front matter.

### What al-folio gives you out of the box

- **`jekyll-seo-tag`** — generates `<title>`, `<meta name="description">`, Open Graph (`og:`), and Twitter Card tags on every page automatically.
- **`jekyll-sitemap`** — generates `/sitemap.xml` for search engine crawlers.
- **`robots.txt`** — included at the root with permissive crawl rules.
- **Canonical URLs** — built into the SEO tag plugin, preventing duplicate content penalties.

---

### `_config.yml` SEO settings

Here are the key fields to fill in:

```yaml
# Site identity
title: Your Name
first_name: First
last_name: Last
email: you@yourname.com
description: >
  Academic researcher and engineer. Writing about systems,
  machine learning, and the occasional DevOps rabbit hole.

# URL — must be your custom domain once Cloudflare is set up
url: https://yourname.com
baseurl: ""

# Keywords used in <meta name="keywords">
keywords: jekyll, academic, portfolio, machine-learning

# Language
lang: en

# Social — used in SEO tags and footer
social:
  name: Your Full Name
  links:
    - https://twitter.com/yourhandle
    - https://github.com/yourusername
    - https://linkedin.com/in/yourprofile

# Google Analytics (optional but useful for tracking search performance)
google_analytics: G-XXXXXXXXXX # your Measurement ID

# Google Search Console verification
google_site_verification: your-verification-token
```

The `social.links` array is picked up by `jekyll-seo-tag` and rendered as `sameAs` JSON-LD structured data, which helps Google associate your profiles across the web.

---

### Per-post front matter for SEO

For each blog post, these front matter fields directly influence how the page is indexed and displayed in search results:

```yaml
---
layout: post
title: "Your Post Title" # <title> tag and og:title
date: 2026-05-17
description: "A concise summary of what this post covers. Aim for
  150–160 characters — this is what appears in Google's
  search result snippets."
tags: [tag1, tag2, tag3]
categories: [category]
og_image: /assets/img/posts/your-preview-image.jpg # og:image for link previews
---
```

> **Tip on descriptions:** Write these as if they're ad copy. They don't directly affect ranking, but a good description improves click-through rate from search results, which does.

---

### Enabling Google Search Console

Once your domain is live:

1. Go to [search.google.com/search-console](https://search.google.com/search-console).
2. Add a new property using your custom domain.
3. Google will ask you to verify ownership. The easiest method is the **HTML tag** approach — copy the `content` value from the meta tag Google provides, and paste it into `_config.yml`:

```yaml
google_site_verification: abc123yourtokenhere
```

Al-folio's `_includes/head.html` already outputs this tag when the field is set. Rebuild and push, then click Verify in Search Console.

4. Once verified, submit your sitemap:

```
https://yourname.com/sitemap.xml
```

---

### Checking your sitemap and robots.txt

After deploying with your custom domain set in `_config.yml`, verify these are generating correctly:

```
https://yourname.com/sitemap.xml
https://yourname.com/robots.txt
```

The default `robots.txt` in al-folio looks like:

```
User-agent: *
Allow: /
Sitemap: https://yourname.com/sitemap.xml
```

If you want to exclude certain pages (e.g. a `/drafts/` path or `/admin/`), you can add `Disallow` rules here.

---

### Structured Data (JSON-LD)

Al-folio doesn't output rich structured data by default beyond what `jekyll-seo-tag` provides. If you want to add `BlogPosting` schema to individual posts (which can enable rich results in Google), add a `_layouts/post.html` override with a JSON-LD block:

```html
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "{{ page.title }}",
    "datePublished": "{{ page.date | date_to_xmlschema }}",
    "description": "{{ page.description }}",
    "url": "{{ page.url | absolute_url }}",
    "author": {
      "@type": "Person",
      "name": "{{ site.first_name }} {{ site.last_name }}"
    }
  }
</script>
```

---

## Quick Reference

| Task                            | Where                                              |
| :------------------------------ | :------------------------------------------------- |
| Add A records for apex domain   | Cloudflare DNS → Records                           |
| Add CNAME for `www`             | Cloudflare DNS → Records                           |
| Set Proxy Status                | DNS only (grey cloud) for all GitHub Pages records |
| Set custom domain               | GitHub repo → Settings → Pages                     |
| Update `url` field              | `_config.yml`                                      |
| Set site description & keywords | `_config.yml`                                      |
| Enable Google Search Console    | `google_site_verification` in `_config.yml`        |
| Submit sitemap                  | Google Search Console → Sitemaps                   |
| Per-post SEO                    | `description` and `og_image` in post front matter  |

---

## Wrapping Up

The Cloudflare + GitHub Pages combination is hard to beat for a personal or academic site: free CDN, DDoS protection, and a clean DNS dashboard. The key gotcha is keeping records in **DNS only** mode so GitHub can handle HTTPS itself — don't let Cloudflare proxy the connection until you have the SSL cert provisioned.

On the SEO side, al-folio handles the heavy lifting through `jekyll-seo-tag` and `jekyll-sitemap`. The main things left for you to do are fill in `_config.yml` properly, write good post `description` fields, and register with Google Search Console so you can actually track how your content performs in search.
