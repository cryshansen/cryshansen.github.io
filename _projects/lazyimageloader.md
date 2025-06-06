---
layout: page
title: Lazy Image Loader
description: Exploring Java Spring Factory and Angular 2+ sends a json response with file image structure parsing for masonry layout front end using angular methods and delegates
img: assets/img/12.jpg
permalink: /projects/java-projects/lazy-image-loader/
importance: 6
category: java
giscus_comments: true
---

### Java Spring Boot Collection

- [Bookit](/projects/java-projects/bookit)
- [fortune-ai](/projects/java-projects/fortune-ai)
- [happy2be](/projects/java-projects/happy2be)
- [calendar](/projects/java-projects/calendar/)
- [gallery-loader](/projects/java-projects/gallery-loader)
- [lazy-image-loader]lazy-image-loader


📸 Java Studio Gallery Project
This project was an exploratory build designed to create a photo studio gallery system using Java EE technologies, Spring, Hibernate, and AngularJS. It demonstrates a hybrid web architecture combining server-side rendering (via JSP) with client-side dynamic behavior (via AngularJS). The project reflects experimentation with both traditional MVC and modern single-page app patterns.

🎯 Project Purpose
To manage and display a list of photography studios and their associated images in a responsive gallery interface, supporting CRUD operations (Create, Read, Update, Delete) through a Java-based backend.

⚙️ Tech Stack
Backend:

Java EE with JSP and Servlets

Spring Framework (manual bean management via SpringFactory)

Hibernate ORM for database persistence

Custom DAO and Manager classes (e.g., StudioDao, StudioManager)

Frontend:

JSP templates using JSTL

AngularJS for dynamic gallery rendering and image loading

Bootstrap 4 for styling and layout

Lazy loading logic for performance optimization

📁 Folder Overview
web/ – Contains the web.xml servlet configuration, wiring StudioController to a specific route.

WebContent/ – Includes both static HTML and dynamic JSP pages, such as:

studio-gallery.jsp – A hybrid JSP page that loads data via AngularJS and displays it in a flexible grid layout.

static_gallery.jsp – A simpler version with hardcoded images for prototyping layout ideas.

src/bll/StudioManager.java – A business logic class responsible for interacting with StudioDao to fetch or update studio records.

🔄 Request Flow (MVC Pattern)
The user visits the gallery page (e.g., studio-gallery.jsp).

AngularJS sends an HTTP request to /StudioController.

StudioController invokes StudioManager methods.

StudioManager calls StudioDao, which uses Hibernate to query the database.

Studio data is returned as JSON to AngularJS, which renders it dynamically into a gallery.

💡 Notes
The codebase reflects an experimentation phase—some JSP pages include AngularJS logic, others serve static content.

A partially implemented HTTP POST flow suggests future plans to allow studio creation or updates via AngularJS.

The architecture shows clear separation between data access (DAO), business logic (Manager), and presentation (JSP + AngularJS).

- [Lazy Image Load Repository](https://github.com/cryshansen/javaRepo/tree/main/lazyImageLoad)


Clean and interesting images of the project will be coming soon. 


<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/1.jpg" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/3.jpg" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/5.jpg" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Caption photos easily. On the left, a road goes through a tunnel. Middle, leaves artistically fall in a hipster photoshoot. Right, in another hipster photoshoot, a lumberjack grasps a handful of pine needles.
</div>
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/5.jpg" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    This image can also have a caption. It's like magic.
</div>

You can also put regular text between your rows of images.
Say you wanted to write a little bit about your project before you posted the rest of the images.
You describe how you toiled, sweated, _bled_ for your project, and then... you reveal its glory in the next row of images.

<div class="row justify-content-sm-center">
    <div class="col-sm-8 mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/6.jpg" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm-4 mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/11.jpg" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    You can also have artistically styled 2/3 + 1/3 images, like these.
</div>

The code is simple.
Just wrap your images with `<div class="col-sm">` and place them inside `<div class="row">` (read more about the <a href="https://getbootstrap.com/docs/4.4/layout/grid/">Bootstrap Grid</a> system).
To make images responsive, add `img-fluid` class to each; for rounded corners and shadows use `rounded` and `z-depth-1` classes.
Here's the code for the last row of images above:

{% raw %}

```html
<div class="row justify-content-sm-center">
  <div class="col-sm-8 mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/6.jpg" title="example image" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-4 mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/11.jpg" title="example image" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
```

{% endraw %}
