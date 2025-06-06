---
layout: page
title: EMTP.com Drupal Project
description: Drupal compontents for Drupal websites and custom modules that span the versions from 8.7 through to 11 modules / theme components and integrations.Below are the projects and notable contributions.
img: assets/img/9.jpg
permalink: /projects/drupal-projects/emtp/
importance: 2
category: drupal
related_publications: true
---

### Drupal Websites Collection

- [Site A – EMTP ] emtp
- [Site B – Artog.co](/projects/drupal-projects/artog-co/)
- [Site C – Pinmento.com](/projects/drupal-projects/pinmento/)

---

## Shared Modules

These custom modules are reused across multiple projects as a base for customized requirements:

- [Star Rating Module](https://github.com/cryshansen/drupal_ratings)
- [Custom Download Module](https://github.com/cryshansen/custom_download)
- [Custom Vector Map Module](https://github.com/cryshansen/custom_vectormap)
- [Conference Agenda Module](https://github.com/cryshansen/conference_agenda)
- [Conference Leads Module](https://github.com/cryshansen/conference_leads)
- [User Profile Account ](https://github.com/cryshansen/user_profile_account)


## Customized Modules

These modules are custom to EMTP with the removal of sensitive or private substance that may be discretionary.

- list coming very soon

## Project Image Gallery
The below screenshots capture some of the modules and components built that visually help relate the modules and features designed and implemented within the site. 
They represent some areas that are more exclusive the EMTP & web ecosystem. The list and images are non-exhaustive. 

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/emtp/DevicesPDFFileMigrationDisplay.png" title="EMTP Devices correletes with custom download" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/emtp/EMTPConferenceAgendaModule.png" title="Conference Agenda module" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/emtp/EMTPEmailModuleBlockModal.png" title="Email Subscription" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    The above set of images are front end displays relative to the code behind for the linked the github modules. Some portions rely on static Block content, and RBA.
</div>
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/emtp/EMTPRBAConfigViews.png" title="Download Module connected to user RBA functionality" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    The above image is associated with a role based page configuration coupled with different code based on user access. This page module is a admin back end configuration page that appends the html to the the given authentication. Completely configurable. Once the user has the correct privileges, they can download the software using a derivative of the custom_download 
</div>

You can also put regular text between your rows of images, even citations {% cite einstein1950meaning %}.


<div class="row justify-content-sm-center">
    <div class="col-sm-8 mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/emtp/QuoteWebFormIntegration.png" title="Web Form Module Integration with Hubspot" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm-4 mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/emtp/OneHourCallBlockPlacement.png" title="One Hour Call Form Block" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
   These images relate to the WebForm Module, webform_handler for Hubspot, Custom EMTP Forms with Block plugins for sales engagements.
</div>

The code is simple.
Customizing the Webform module to send data through to an api create a form then navigate to the handlers section choose "Remote Post" to create a new handler with uri / method and json payload tokens : 

{% raw %}
```json

{
  "name": "[webform_submission:values:name]",
  "email": "[webform_submission:values:email]",
  "message": "[webform_submission:values:message]"
}


```
{% endraw %}

{% raw %}

```html
<?php
namespace Drupal\your_module\WebformHandler;

use Drupal\webform\Plugin\WebformHandlerBase;
use Drupal\webform\WebformSubmissionInterface;

/**
 * Sends submission to external API.
 *
 * @WebformHandler(
 *   id = "api_post_handler",
 *   label = @Translation("API Post Handler"),
 *   category = @Translation("Custom"),
 *   description = @Translation("Posts data to external API.")
 * )
 */
class ApiPostHandler extends WebformHandlerBase {

  public function submitForm(array &$form, FormStateInterface $form_state, WebformSubmissionInterface $webform_submission) {
    $data = $webform_submission->getData();

    $client = \Drupal::httpClient();
    $response = $client->post('https://your.api/endpoint', [
      'json' => $data,
      'headers' => [
        'Authorization' => 'Bearer YOUR_TOKEN',
      ],
    ]);

    // Optionally check response, log, etc.
  }
}

```

{% endraw %}