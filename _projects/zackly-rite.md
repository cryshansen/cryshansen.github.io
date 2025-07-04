---
layout: page
title: Zackly-rite Project
description: Vanilla website build with Bootstrap and PHP api for booking appointments
img: assets/img/9.jpg
permalink: /projects/zackly-rite/
importance: 1
category: work
related_publications: false
---

### Introduction

This project is a vanilla Bootstrap and PHP-based booking platform designed for streamlined session scheduling and administration. The front end utilizes clean Bootstrap styling while the back end is powered by a structured custom PHP API, which integrates with a Java-based Bookit system for seamless cross-platform coordination.

The booking system uses GET methods for simplicity, alongside front-end and back-end token validation to prevent duplicate bookings within the same session. For administration, a FullCalendar.js interface allows for real-time appointment management, with an optional Google Calendar integration in development to offer flexible syncing and alternate administrative access.

Additional tools include PHPMailer for transactional email handling and google-api-php-client for managing calendar synchronization. The system emphasizes clarity, reliability, and modularity—ideal for solo practitioners or small teams seeking a lightweight, custom booking solution. Please visit https://zackly-rite.ca


### General Websites Collection

- [Site A – zackly-rite ]zackly-rite
- [Site B – crystalhansenartographic]()
- [Site D - chartcom](https://crystalhansenartographic.com)

##### Wordpress site
- [Site C – crystalhansenartographic.ca](/projects/wp-artographic/)

---


<br>
<hr>
<br>
Unique to Zackly-rite 

    -- Use of a booking system coupled with a structured php api to connect `bookit` java implementation found under the java projects
    -- Uses get methods for simplicity of booking coupled with front end and back end tokens to track the bookings so that there are no duplication during a session. 
    -- Full-calendar appointment view for administration of the site. 
    -- Integration with google calendar to facilitate a second implementation option for administration. TBD.
    -- third party frameworks PHPMailer, google-api-php-client




## Project Image Gallery
The below screenshots capture some of the modules and components built that visually help relate the modules and features designed and implemented within the site. 
They represent some areas that are exclusive the the Artog.co ecosystem. The list and images are non-exhaustive. 

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/zackly-rite/zackly-rite-logo.png" title="Zackly-rite logo" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/zackly-rite/zackly-rite-calendar.png" title="Calendar View" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/zackly-rite/day-available.png" title="Day Availablity View" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    The above set of images are front end displays relative to the code behind for the links to github repository.
  On the left we have the header and logo of the site, Middle image is the calendar display with first days available via greyout, todays date hightligted, Right image we have the day availability screen 
</div>

This site is a one page website that encompasess a booking interface for the bookit java spring boot implementation. 
<div class="row justify-content-sm-center">
    <div class="col-sm-8 mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/zackly-rite/booking-details.png" title="Booking Details" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm-4 mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/zackly-rite/booking-details-alert.png" title="Booking Details captured from form" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
   The most interesting thing about this website is the booking integration using a vanilla php api to connect the interface with the backend storage
</div>
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/zackly-rite/confirmation-screen.png" title="Confirmation Screen" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/zackly-rite/appointment-confirmation-number.png" title="Confirmation Number alert" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/zackly-rite/email-confirmation-view.png" title="Email Client Confirmation" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

