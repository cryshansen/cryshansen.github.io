---
layout: page
title: Pinmento.com Drupal Project
description: Drupal custom website modules that span the versions from 8.7 through to 11 modules / theme components and integrations.Below are the projects and notable contributions.
img: assets/img/9.jpg
permalink: /projects/drupal-projects/pinmento/
importance: 4
category: drupal
related_publications: true
---

### Drupal Websites Collection

- [Site A – EMTP ](/projects/drupal-projects/emtp/)
- [Site B – Artog.co](/projects/drupal-projects/artog-co/)
- [Site C – Pinmento.com] pinmento


---

<hr>

## Custom Modules

These custom modules are integrations of Google Maps settings and interactions:

- [Custom Vector Map Module](https://github.com/cryshansen/custom_vectormap)
- [Map Pins Module](https://github.com/cryshansen/map_pins)
- [Pin Drop Locations ](https://github.com/cryshansen/pin_drop_location)


## Project Image Gallery
The below screenshots capture some of the modules and components built that visually help relate the modules and features designed and implemented within the site. 
They represent some areas that are more exclusive the the Pinmento ecosystem. The list and images are non-exhaustive. 

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/pinmento/orbie-layout.png" title="Fortune-ai drupal integration chat bot" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/pinmento/orbie-chatgpt-response-button-key.png" title="Fortune-ai drupal integration chat bot" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/pinmento/random-based-response-enter-key.png" title="Fortune-ai drupal integration chat botn" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    The above set of images are front end displays relative to the code behind for the linked the github modules. Some portions rely on static Block content, and RBA.
</div>
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/pinmento/pin-location-form.png" title="Pin Locations Form Data and image" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/pinmento/recent-pins.png" title="Recent Posted Pins Public view" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/576x400_ltgrey.png" title="576x400 Placeholder" class="img-fluid rounded z-depth-1" %}
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
Interface mockup found over at codepen.io: (https://codepen.io/Shankar-Aryal/pen/gbYBwLp)
You can also put regular text between your rows of images, even citations {% cite einstein1950meaning %}.
Say you wanted to write a bit about your project before you posted the rest of the images.
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
