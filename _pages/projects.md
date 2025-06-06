---
layout: page
title: projects
permalink: /projects/
description: 
nav: true
nav_order: 3
display_categories: [drupal,java, python, work, fun]
horizontal: false
---
Welcome to my Technology Portfolio — a curated overview of the solutions I've developed across diverse technology stacks. From robust content management systems to intelligent automation tools and custom business applications, my work spans open-source platforms and advanced programming languages. Dive into my core development areas:

Enterprise-grade web solutions in <a href="#drupal"> Drupal </a>.

Scalable and reliable <a href="#java">Java</a> applications.

Agile <a href="#python">Python</a> tools and intelligent automation.

Whether you're seeking content architecture, e-commerce capabilities, or data-driven interfaces, my experience reflects a commitment to delivering maintainable and elegant solutions.

<!-- pages/projects.md -->
<div class="projects">
{% if site.enable_project_categories and page.display_categories %}
  <!-- Display categorized projects -->
  {% for category in page.display_categories %}
  
    <h2 id="{{ category }}" class="category">{{ category }}</h2>

  {% assign categorized_projects = site.projects | where: "category", category %}
  {% assign sorted_projects = categorized_projects | sort: "importance" %}
  <!-- Generate cards for each project -->
  {% if page.horizontal %}
  <div class="container">
    <div class="row row-cols-1 row-cols-md-2">
    {% for project in sorted_projects %}
      {% include projects_horizontal.liquid %}
    {% endfor %}
    </div>
  </div>
  {% else %}
  <div class="row row-cols-1 row-cols-md-3">
    {% for project in sorted_projects %}
      {% include projects.liquid %}
    {% endfor %}
  </div>
  {% endif %}
  {% endfor %}

{% else %}

<!-- Display projects without categories -->

{% assign sorted_projects = site.projects | sort: "importance" %}

  <!-- Generate cards for each project -->

{% if page.horizontal %}

  <div class="container">
    <div class="row row-cols-1 row-cols-md-2">
    {% for project in sorted_projects %}
      {% include projects_horizontal.liquid %}
    {% endfor %}
    </div>
  </div>
  {% else %}
  <div class="row row-cols-1 row-cols-md-3">
    {% for project in sorted_projects %}
      {% include projects.liquid %}
    {% endfor %}
  </div>
  {% endif %}
{% endif %}
</div>
