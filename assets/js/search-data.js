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
        },{id: "post-google-gemini-updates-flash-1-5-gemma-2-and-project-astra",
        
          title: 'Google Gemini updates: Flash 1.5, Gemma 2 and Project Astra <svg width="1.2rem" height="1.2rem" top=".5rem" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M17 13.5v6H5v-12h6m3-3h6v6m0-6-9 9" class="icon_svg-stroke" stroke="#999" stroke-width="1.5" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
        
        description: "We’re sharing updates across our Gemini family of models and a glimpse of Project Astra, our vision for the future of AI assistants.",
        section: "Posts",
        handler: () => {
          
            window.open("https://blog.google/technology/ai/google-gemini-update-flash-ai-assistant-io-2024/", "_blank");
          
        },
      },{id: "post-displaying-external-posts-on-your-al-folio-blog",
        
          title: 'Displaying External Posts on Your al-folio Blog <svg width="1.2rem" height="1.2rem" top=".5rem" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M17 13.5v6H5v-12h6m3-3h6v6m0-6-9 9" class="icon_svg-stroke" stroke="#999" stroke-width="1.5" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.open("https://medium.com/@al-folio/displaying-external-posts-on-your-al-folio-blog-b60a1d241a0a?source=rss-17feae71c3c4------2", "_blank");
          
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
            },},{id: "projects-crystal-hansen-artographic-project",
          title: 'Crystal Hansen Artographic Project',
          description: "An exploration in React Frameworks v2 to learn practically with an html site and includes.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/chartcom/";
            },},{id: "projects-crystal-hansen-artographic-project",
          title: 'Crystal Hansen Artographic Project',
          description: "An exploration in React Frameworks v1 to learn practically with an html site and includes.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/crystalhansenartographic/";
            },},{id: "projects-curiosity",
          title: 'Curiosity',
          description: "Some fun creative insiprations to evolve coming soon",
          section: "Projects",handler: () => {
              window.location.href = "/projects/curiosity/";
            },},{id: "projects-dream-big",
          title: 'Dream Big',
          description: "Dream big fly high 🎉",
          section: "Projects",handler: () => {
              window.location.href = "/projects/dream-big/";
            },},{id: "projects-drupal-development-projects",
          title: 'Drupal Development Projects',
          description: "Drupal compontents for Drupal websites and custom modules that span the versions from 8.7 through to 11 modules / theme components and integrations.Below are the projects and notable contributions.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/drupal-projects/";
            },},{id: "projects-emtp-com-drupal-project",
          title: 'EMTP.com Drupal Project',
          description: "Drupal compontents for Drupal websites and custom modules that span the versions from 8.7 through to 11 modules / theme components and integrations.Below are the projects and notable contributions.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/drupal-projects/emtp/";
            },},{id: "projects-fortune-ai",
          title: 'Fortune ai',
          description: "Fortune ai is a Java spring boot api connected to chatgpt with a &#39;category&#39; prompt. It returns a possitive message based on the topic",
          section: "Projects",handler: () => {
              window.location.href = "/projects/java-projects/fortune-ai/";
            },},{id: "projects-gallery-loader",
          title: 'Gallery Loader',
          description: "Exploring Java Spring Factory and Angular.js sends a json response with file image structure parsing for masonry layout front end using angular methods and delegates",
          section: "Projects",handler: () => {
              window.location.href = "/projects/java-projects/gallery-loader";
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
            },},{id: "projects-python-projects-a-collection-of-applications-and-integrations",
          title: 'Python Projects - a collection of applications and integrations',
          description: "A variety of python explorations and implementations ranging from screen scrapers to full flask app.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/python-projects/";
            },},{id: "projects-python-web-page-scraper",
          title: 'Python Web Page Scraper',
          description: "A compilation of page scrapers and parsing data for databse injection",
          section: "Projects",handler: () => {
              window.location.href = "/projects/python-projects/scraper-master/";
            },},{id: "projects-spring-boot-java-projects-a-collection-of-applications-and-integrations",
          title: 'Spring Boot Java Projects - a collection of applications and integrations',
          description: "with background image",
          section: "Projects",handler: () => {
              window.location.href = "/projects/spring-projects/";
            },},{id: "projects-what-39-s-next",
          title: 'What&amp;#39;s next',
          description: "My next project - what creative inspiration driving curiousities",
          section: "Projects",handler: () => {
              window.location.href = "/projects/whats-next/";
            },},{id: "projects-artographic-wordpress-project",
          title: 'Artographic Wordpress Project',
          description: "Wordpress driven website of crystalhansenartographic.ca incorporating polling and brevo connections.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/wp-artographic/";
            },},{id: "projects-zackly-rite-booking-app-project",
          title: 'Zackly-Rite Booking App Project',
          description: "An exploration in React Frameworks to learn practically with refactoring a vanilla site into a modern frameworks.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/zackly-rite-spa/";
            },},{id: "projects-zackly-rite-project",
          title: 'Zackly-rite Project',
          description: "Vanilla website build with Bootstrap and PHP api for booking appointments",
          section: "Projects",handler: () => {
              window.location.href = "/projects/zackly-rite/";
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
