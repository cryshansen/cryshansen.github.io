// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-blog",
          title: "blog",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/blog/";
          },
        },{id: "nav-projects",
          title: "projects",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/projects/";
          },
        },{id: "nav-repositories",
          title: "repositories",
          description: "Below you find Crystal Hansens project repositories that contain some prominent personal and professional development stacks.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/repositories/";
          },
        },{id: "nav-cv",
          title: "cv",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/cv/";
          },
        },{id: "post-running-maven-builds-from-testing-to-ec2-deployment",
        
          title: "Running Maven Builds: From Testing to EC2 Deployment",
        
        description: "A practical guide to running mvn test, packaging your Java app, and deploying it to AWS EC2 — including CI/CD with GitHub Actions and running as a systemd service.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/mvn-build-test-deploy-ec2/";
          
        },
      },{id: "post-layer-5-spring-security-role-based-authorization-and-cors",
        
          title: "Layer 5 — Spring Security: Role-Based Authorization and CORS",
        
        description: "A deep dive into Spring Security&#39;s authorization layer — covering @PreAuthorize, tenant-scoped roles, CORS configuration mistakes, and the integration tests that validate the full security chain.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/layer5-spring-security-roles-cors/";
          
        },
      },{id: "post-layer-4-api-key-authentication-securing-machine-to-machine-requests",
        
          title: "Layer 4 — API Key Authentication: Securing Machine-to-Machine Requests",
        
        description: "A deep dive into API key authentication in a Spring Boot multi-tenant API — covering when to use keys vs JWTs, hashing at rest, the session passthrough bug, and a complete test matrix.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/layer4-api-key-authentication/";
          
        },
      },{id: "post-layer-2-tenant-resolution-how-a-single-api-instance-serves-multiple-customers-safely",
        
          title: "Layer 2 — Tenant Resolution: How a Single API Instance Serves Multiple Customers...",
        
        description: "A deep dive into multi-tenant data isolation using Host-header-based tenant resolution, thread-local context, and Hibernate filters — including the failure modes that cause data leakage.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/layer2-tenant-resolution/";
          
        },
      },{id: "post-layer-1-nginx-as-your-security-perimeter-ssl-termination-and-access-logging",
        
          title: "Layer 1 — nginx as Your Security Perimeter: SSL Termination and Access Logging...",
        
        description: "A deep dive into using nginx as the outermost security layer in a multi-tenant SaaS — covering TLS configuration, Let&#39;s Encrypt automation, access log design, and rate limiting.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/layer1-nginx-ssl-termination/";
          
        },
      },{id: "post-setting-up-transactional-amp-marketing-email-with-aws-ses",
        
          title: "Setting Up Transactional &amp; Marketing Email with AWS SES",
        
        description: "A developer&#39;s guide to configuring AWS SES for transactional email, DNS authentication, multi-tenant templates, and marketing nurture sequences.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/aws-ses-email-setup/";
          
        },
      },{id: "post-security-auditing-in-a-multi-tenant-saas-layered-filters-jwt-and-api-keys",
        
          title: "Security Auditing in a Multi-Tenant SaaS: Layered Filters, JWT, and API Keys",
        
        description: "A practical walkthrough of how a layered security filter chain protects a multi-tenant Spring Boot API — covering SSL termination, tenant isolation, JWT validation, API key auth, and role-based access.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/security-auditing-layers-multitenant-saas/";
          
        },
      },{id: "post-layer-3-jwt-authentication-stateless-identity-with-short-lived-tokens",
        
          title: "Layer 3 — JWT Authentication: Stateless Identity with Short-Lived Tokens",
        
        description: "A deep dive into JWT authentication in a Spring Boot multi-tenant API — covering algorithm choice, claim design, expiry, token validation order, and the tests that prove it&#39;s working.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/layer3-jwt-authentication/";
          
        },
      },{id: "post-sns-bounce-amp-complaint-webhook-handling-with-aws-ses",
        
          title: "SNS Bounce &amp; Complaint Webhook Handling with AWS SES",
        
        description: "How to configure AWS SNS to receive SES bounce and complaint notifications, expose a webhook endpoint, and maintain a suppression list that protects your sending reputation.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/ses-bounce-complaint-handling/";
          
        },
      },{id: "post-building-sovereign-social-automation-with-meta-39-s-system-users",
        
          title: "Building Sovereign Social Automation with Meta&#39;s System Users",
        
        description: "A technical guide on bypassing session flakes using Meta System Users for multi-tenant SaaS.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/building-sovereign-social-automation/";
          
        },
      },{id: "post-scheduled-email-triggers-amp-nurture-sequence-architecture",
        
          title: "Scheduled Email Triggers &amp; Nurture Sequence Architecture",
        
        description: "How to design and implement a scheduled email trigger system and multi-step marketing nurture sequences using Spring Scheduler, conditional state evaluation, and AWS SES.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/ses-scheduled-nurture-sequences/";
          
        },
      },{id: "post-multi-tenant-from-address-resolution-amp-spring-emailservice",
        
          title: "Multi-Tenant FROM Address Resolution &amp; Spring EmailService",
        
        description: "How to build a Spring @Service that resolves the correct sender address per tenant and renders per-tenant email templates from a database or file fallback.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/ses-multi-tenant-email-service/";
          
        },
      },{id: "post-docker-cheatsheet-for-the-mindless",
        
          title: "Docker Cheatsheet for the Mindless",
        
        description: "Docker cheat sheet for quick reference of common tasks.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/docker-cheat-sheet-for-the-mindless/";
          
        },
      },{id: "post-designing-a-multi-tenant-saas-where-each-industry-feels-like-its-own-product",
        
          title: "Designing a Multi-Tenant SaaS Where Each Industry Feels Like Its Own Product",
        
        description: "Building Platforms that work.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/designing-multi-tenant-saas-where-industries-feel-brand/";
          
        },
      },{id: "post-the-gpu-less-ai-server-running-heavy-python-models-and-java-apps-on-a-budget",
        
          title: "The GPU-less AI Server: Running Heavy Python Models and Java Apps on a...",
        
        description: "Running a GPU-less Spring Boot app with python models.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/the-gpu-less-ai-server-running-heavy-py/";
          
        },
      },{id: "post-building-a-dropin-chatbot-widget-for-any-spa-app",
        
          title: "Building a Dropin Chatbot Widget for any SPA App",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/react-chatbot-widget-feature/";
          
        },
      },{id: "post-react-login-series-reusing-the-feature-in-another-app-part-7",
        
          title: "React Login Series - Reusing the Feature in Another App | Part 7...",
        
        description: "Part 7 Login Series focuses on installation of this feature into any v19 react app.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/react-login-07-include-login-feature-in-another-app/";
          
        },
      },{id: "post-react-login-series-login-feature-complete-test-suite-part-6b",
        
          title: "React Login Series - Login Feature Complete Test Suite | Part 6b",
        
        description: "Part 6b in our Login Series covers the discussion of testing all layers of the application in its final Test Suite for Production.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/post-6-testing-suite/";
          
        },
      },{id: "post-what-git-never-explains-stacked-branches-amp-merge-order",
        
          title: "What Git Never Explains -- Stacked Branches &amp; Merge Order",
        
        description: "Github how to on merging branches commits with multiple branch history",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/what-github-doesnt-teach/";
          
        },
      },{id: "post-why-branch-discipline-in-git-isn-t-optional-and-how-it-saved-this-auth-refactor",
        
          title: "Why Branch Discipline in Git Isn’t Optional (And How It Saved This Auth...",
        
        description: "This Post describes the use of git to manage two branches of ongoing work and how  to do it.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/why-github-branch-discipline-in-git-isnt-optional/";
          
        },
      },{id: "post-react-login-series-testing-the-login-feature-rtl-jest-part-6",
        
          title: "React Login Series - Testing the Login Feature (RTL + Jest) | Part...",
        
        description: "Part 6 in our Login Series covers the tesing aspect of our login features using RTL + Jset to ensure security and code functions as expected.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/react-login-06-testing-login-feature/";
          
        },
      },{id: "post-react-login-series-auth-context-cookie-auth-part-5b",
        
          title: "React Login Series - Auth Context Cookie Auth | Part 5b",
        
        description: "Part 5 of this series walks through the authentication context using cookies vs session persistence.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/react-login-05-auth-context-cookie-persistence/";
          
        },
      },{id: "post-react-login-series-auth-context-session-persistence-amp-logout-part-5",
        
          title: "React Login Series - Auth Context Session, Persistence &amp; Logout | Part 5...",
        
        description: "Part 5 of this series walks through the authentication context, session state, persistence and login/logout functionality.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/react-login-05-auth-context-session-persistence/";
          
        },
      },{id: "post-react-login-series-auth-api-layer-amp-environment-decoupling-part-4a",
        
          title: "React Login Series - Auth API Layer &amp; Environment Decoupling | Part 4a...",
        
        description: "A production-style authentication system built with React, Tailwind, localStorage, API ready, and full testing coverage.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/react-login-04-auth-api-implementation-express/";
          
        },
      },{id: "post-react-login-series-auth-api-designing-amp-managing-endpoints-part-4b",
        
          title: "React Login Series - Auth API Designing &amp; Managing Endpoints | Part 4b...",
        
        description: "A production-style authentication system built with React, Tailwind, localStorage, API ready, and full testing coverage.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/react-login-04-auth-api-endpoints/";
          
        },
      },{id: "post-react-login-series-auth-api-layer-amp-environment-decoupling-part-4a",
        
          title: "React Login Series - Auth API Layer &amp; Environment Decoupling | Part 4a...",
        
        description: "A production-style authentication system built with React, Tailwind, localStorage, API ready, and full testing coverage.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/react-login-04-auth-api-decoupling/";
          
        },
      },{id: "post-react-login-series-auth-api-integrating-an-authentication-api-part-4c",
        
          title: "React Login Series - Auth API Integrating an Authentication API | Part 4c...",
        
        description: "A production-style authentication system built with React, Tailwind, localStorage, API ready, and full testing coverage.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/react-login-04-auth-api-code/";
          
        },
      },{id: "post-react-login-series-route-guards-auth-flow-part-3b",
        
          title: "React Login Series -  Route Guards Auth Flow | Part 3b",
        
        description: "In this Part of the series we look at guarding routes in a feature-based react auth flow",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/react-login-03-guarding-routes/";
          
        },
      },{id: "post-setting-up-nvm-on-macos-node-version-manager",
        
          title: "Setting Up NVM on macOS (Node Version Manager)",
        
        description: "A practical guide to installing and using NVM on macOS for managing multiple Node.js versions.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/setting-up-nvm-on-macos/";
          
        },
      },{id: "post-extracting-password-inputs-in-react-login-signup-reset-part-2b",
        
          title: "Extracting Password Inputs in React (Login, Signup, Reset) | Part 2b",
        
        description: "Designing reusable password components for different authentication flows",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/react-login-extracting-password-inputs-components/";
          
        },
      },{id: "post-using-github-like-a-professional-branches-tags-and-reintegrating-work-into-main",
        
          title: "Using GitHub Like a Professional Branches, Tags, and Reintegrating Work into Main",
        
        description: "How to structure a GitHub repo for a blog series while following real-world, business-grade workflows.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/using-github-profesionally/";
          
        },
      },{id: "post-login-series-adding-a-password-strength-meter-in-react-part-2c",
        
          title: "Login Series Adding a Password Strength Meter in React  | Part 2c",
        
        description: "Layering password strength validation into reusable auth components",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/react-authentication-adding-password-strength-meter/";
          
        },
      },{id: "post-jsx-vs-tsx-when-to-use-each-and-why-we-often-mix-them",
        
          title: "JSX vs TSX — When to Use Each (and Why We Often Mix...",
        
        description: "Understanding why modern React apps mix JS, JSX, and TSX — and when TypeScript actually pays off.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/jsx-vs-tsx-mixed-react-apps/";
          
        },
      },{id: "post-getting-started-with-react-a-modern-step-by-step-guide",
        
          title: "Getting Started with React: A Modern Step-by-Step Guide",
        
        description: "A practical tutorial for creating a React app using modern tooling like Vite, hooks, and functional components.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/getting-started-react-app/";
          
        },
      },{id: "post-react-login-series-managing-state-amp-side-effects-part-3",
        
          title: "React Login Series - Managing State &amp; Side Effects | Part 3",
        
        description: "In this Part of the series we look at the useAuth React Hook to manage state and effects",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/react-login-03-state-hooks/";
          
        },
      },{id: "post-react-login-series-design-and-integrate-tailwind-ui-part-2d",
        
          title: "React Login Series - Design and Integrate Tailwind UI  | Part 2d",
        
        description: "This step continues on the Login Feature convertion of Tailwind UI page components required for the login/registration feature.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/react-login-02-UI-tailwind/";
          
        },
      },{id: "post-react-login-series-design-and-integrate-tailwind-ui-part-2a",
        
          title: "React Login Series - Design and Integrate Tailwind UI  | Part 2a",
        
        description: "Part 2, React Login Feature walks through creating and implementing the UI using tailwind components available online to source.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/react-login-01-layout/";
          
        },
      },{id: "post-react-login-series-building-a-reusable-login-feature-routing-setup-part-1a",
        
          title: "React Login Series - Building a Reusable Login Feature | Routing Setup |...",
        
        description: "Part 1 of the React Login Feature walk through covering app setup, dependencies, routing, layouts, and feature-first structure including UI pages &amp; forms for the feature.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/react-login-feature-routing-setup/";
          
        },
      },{id: "post-react-login-series-building-a-login-feature-7-part-series",
        
          title: "React Login Series - Building a Login Feature | 7 Part Series",
        
        description: "A production-style authentication system built with React, Tailwind, using localStorage, API abstraction, and full testing coverage.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/react-login-feature/";
          
        },
      },{id: "post-fixing-port-8080-already-in-use-in-docker-a-devops-walkthrough",
        
          title: "Fixing Port 8080 Already In Use in Docker - A DevOps Walkthrough",
        
        description: "this is what included image galleries could look like",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/fixing-port-use-in-docker/";
          
        },
      },{id: "post-building-out-a-docker-container-for-spring-boot-mailhog-and-database",
        
          title: "Building out a Docker Container for Spring Boot MailHog and Database",
        
        description: "Every developer needs a container that runs without conflict to isolate bugs in processes.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/building-docker-github-actions-container/";
          
        },
      },{id: "post-building-a-studio-booking-app",
        
          title: "Building a Studio Booking App",
        
        description: "Ever want to build a booking app and see what is under the hood of such a system?",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/studio-booking-tutorial/";
          
        },
      },{id: "post-using-ngrx-store-with-localstorage-in-a-standalone-angular-app",
        
          title: "Using NgRx Store with LocalStorage in a Standalone Angular App",
        
        description: "Looking for a local storage tutorial that gives you a workable business case other than shopping carts?",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/ngrx-localstorage-tutorial/";
          
        },
      },{id: "books-the-godfather",
          title: 'The Godfather',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/the_godfather/";
            },},{id: "projects-artog-co-drupal-project",
          title: 'Artog.co Drupal Project',
          description: "Drupal 11 websites and custom  modules / theme components and integrations. Below are notable contributions.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/drupal-projects/artog-co/";
            },},{id: "projects-bookit",
          title: 'Bookit',
          description: "A simple booking system API with Java Spring Boot AWS cloud environment EC2 and RDS",
          section: "Projects",handler: () => {
              window.location.href = "/projects/java-projects/bookit/";
            },},{id: "projects-calendar",
          title: 'Calendar',
          description: "Exploring Java and Angular.js creating a full calendar with angular methods and delegations",
          section: "Projects",handler: () => {
              window.location.href = "/projects/java-projects/calendar/";
            },},{id: "projects-crystal-hansen-artographic-platform",
          title: 'Crystal Hansen Artographic Platform',
          description: "A full stack development of a photography driven personal website to embody a full feature studio profession, workshops, products, studio features.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/chartcom/";
            },},{id: "projects-emtp-com-drupal-project",
          title: 'EMTP.com Drupal Project',
          description: "Drupal compontents for Drupal websites and custom modules that span the versions from 8.7 through to 11 modules / theme components and integrations.Below are the projects and notable contributions.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/drupal-projects/emtp/";
            },},{id: "projects-flashcard-study-app-platform",
          title: 'Flashcard Study App Platform',
          description: "An angular front end study guide and interview questions app to facilitate recall learned concepts and responses to inteviews.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/flashcards/";
            },},{id: "projects-python-license-spring-api",
          title: 'Python License Spring API',
          description: "A compilation of data information endpoint connections to gather and parsing data related to EMTP.com Licenses.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/python-projects/flask-generate-sales/";
            },},{id: "projects-fortune-ai",
          title: 'Fortune ai',
          description: "Fortune ai is a Java spring boot api connected to chatgpt with a &#39;category&#39; prompt. It returns a possitive message based on the topic",
          section: "Projects",handler: () => {
              window.location.href = "/projects/java-projects/fortune-ai/";
            },},{id: "projects-happy2be",
          title: 'Happy2be',
          description: "Furthering my exploration in Java Spring Boot APIs and cloud technologies",
          section: "Projects",handler: () => {
              window.location.href = "/projects/java-projects/happy2be/";
            },},{id: "projects-python-happyfaces",
          title: 'Python HappyFaces',
          description: "A local run/flask integration of the distilbert pretrained positive negative classification.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/python-projects/happyfaces/";
            },},{id: "projects-lazy-image-loader",
          title: 'Lazy Image Loader',
          description: "Exploring Java Spring Factory and Angular 2+ sends a json response with file image structure parsing for masonry layout front end using angular methods and delegates",
          section: "Projects",handler: () => {
              window.location.href = "/projects/java-projects/lazy-image-loader/";
            },},{id: "projects-python-license-spring-api",
          title: 'Python License Spring API',
          description: "A compilation of data information endpoint connections to gather and parsing data related to EMTP.com Licenses.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/python-projects/license-spring-api/";
            },},{id: "projects-pinmento-com-drupal-project",
          title: 'Pinmento.com Drupal Project',
          description: "Drupal custom website modules that span the versions from 8.7 through to 11 modules / theme components and integrations.Below are the projects and notable contributions.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/drupal-projects/pinmento/";
            },},{id: "projects-python-web-page-scraper",
          title: 'Python Web Page Scraper',
          description: "A compilation of page scrapers and parsing data for databse injection",
          section: "Projects",handler: () => {
              window.location.href = "/projects/python-projects/scraper-master/";
            },},{id: "projects-studio-booker-platform",
          title: 'Studio Booker Platform',
          description: "A full stack development of a photography studio booking application using Angular and PHP-API, with the `bookit` SpringBoot API.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/studio-booker/";
            },},{id: "projects-artographic-wordpress-agency-project",
          title: 'Artographic Wordpress Agency Project',
          description: "Wordpress driven website of crystalhansenartographic.ca as an agency for web development incorporating polling and brevo connections.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/wp-artographic/";
            },},{id: "projects-zackly-rite-appointment-booking-app-project",
          title: 'Zackly-Rite Appointment Booking App Project',
          description: "A React Based Single Page massage therapist booking application for small business exposure and engagement with clients.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/zackly-rite-spa/";
            },},{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%63%72%79%73%74%61%6C%68%61%6E%73%65%6E@%63%72%79%73%74%61%6C%68%61%6E%73%65%6E%61%72%74%6F%67%72%61%70%68%69%63.%63%6F%6D", "_blank");
        },
      },{
        id: 'social-github',
        title: 'GitHub',
        section: 'Socials',
        handler: () => {
          window.open("https://github.com/cryshansen", "_blank");
        },
      },{
        id: 'social-linkedin',
        title: 'LinkedIn',
        section: 'Socials',
        handler: () => {
          window.open("https://www.linkedin.com/in/crystalhansenartographic", "_blank");
        },
      },{
        id: 'social-custom_social',
        title: 'Custom_social',
        section: 'Socials',
        handler: () => {
          window.open("https://www.crystalhansenartographic.com/", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
