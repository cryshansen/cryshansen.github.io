---
layout: page
title: Bookit
description: A simple booking system API with Java Spring Boot AWS cloud environment EC2 and RDS 
img: assets/img/12.jpg
permalink: /projects/java-projects/bookit/
importance: 3
category: java
---


### Java Spring Boot Collection

- [ Bookit ] bookit
- [fortune-ai](/projects/java-projects/fortune-ai)
- [happy2be](/projects/java-projects/happy2be)
- [calendar](/projects/java-projects/calendar/)
- [gallery-loader](/projects/java-projects/gallery-loader)
- [lazy-image-loader](/projects/java-projects/lazy-image-loader/)


This project is the inspiration for future projects intended to grow in the booking ecosystem. This particular project focuses only on backend and a vanilla style html / javascript page to make building quicker and faster as version 1 evolves into React and Angular integrated packages.

Visit the repo and kick start your project! 

- [Bookit Repository](https://github.com/cryshansen/bookit)


Images are for layout purposes and soon to come!



<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/java/michael-c-A3K6lKG4yKY-unsplash.jpg" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/java/mockup-free-37cb_vU9cg4-unsplash.jpg" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/java/mockup-free-LHqGt6byYng-unsplash.jpg" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Caption photos easily. On the left, a road goes through a tunnel. Middle, leaves artistically fall in a hipster photoshoot. Right, in another hipster photoshoot, a lumberjack grasps a handful of pine needles.
</div>
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/java/mockup-free-M8Pptu0rVqk-unsplash.jpg" title="example image" class="img-fluid rounded z-depth-1" %}
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
        {% include figure.liquid path="assets/img/java/mockup-free-xUoGSlh0LhU-unsplash.jpg" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm-4 mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/java/mockup-free-zQGl_3j6QOM-unsplash.jpg" title="example image" class="img-fluid rounded z-depth-1" %}
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
