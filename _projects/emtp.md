---
layout: page
title: EMTP.com Drupal Project
description: Drupal compontents for Drupal websites and custom modules that span the versions from 8.7 through to 11 modules / theme components and integrations.Below are the projects and notable contributions.
img: assets/img/9.jpg
permalink: /projects/drupal-projects/emtp/
importance: 2
category: drupal
related_publications: false
---

### Drupal Websites Collection

- [Site A – EMTP ] emtp
- [Site B – Artog.co](/projects/drupal-projects/artog-co/)
- [Site C – Pinmento.com](/projects/drupal-projects/pinmento/)

---

## Shared Modules

These custom modules are reused across multiple projects as a base for customized requirements:

- [Email Subscriber Module](https://github.com/cryshansen/email_subscriber)
- [Star Rating Module](https://github.com/cryshansen/drupal_ratings)
- [Custom Download Module](https://github.com/cryshansen/custom_download)
- [Custom Vector Map Module](https://github.com/cryshansen/custom_vector)
- [Conference Agenda Module](https://github.com/cryshansen/conference_agenda)
- [Conference Leads Module](https://github.com/cryshansen/conference_leads)
- [User Profile Account ](https://github.com/cryshansen/user_profile_account)


## Customized Modules

These modules are custom to EMTP with the removal of sensitive or private substance that may be discretionary.

- emtp_migration -- migration of an external database of content, requires content types, setting up image and file fields to import correctly. It utilized the Migrate Module dependance built in to Drupal.  The code base ran against multiple tables in a secondary database to create the content types and its files storage to improve upon SEO.
- emtp_forms -- specialized forms specific to the EMTP Sales engagements. includes a data flow to Hubspot for handling workflows within sales / deals containers. see [Email Subscriber Module](https://github.com/cryshansen/email_subscriber) for a basic configuration page similar to this customized module.
- emtp_api -- connects user and hubspot for account creations. Uses the built in HTTP Basic Authentication and RESTful Web Services to process User functionality.
- emtp_email_subscriber -- uses email subscriber to extend into a customized module functionality. Includes a brevo api connection push to hubspot via a brevo workflow. See - [Email Subscriber Module](https://github.com/cryshansen/email_subscriber). The emtp site required emails to both internal sales and external to client to respond with an appropriate message and therefore these elements are also included in the configuration of emtp forms. 
- devices_read_folder -- this modules reads the content of the devices folder which correlates to the software devices components and their documentation. The need is to upload changing files dependent on the new software release that can be found or used by sales when supporting the software.


### Web Developer Role:

The emtp.com website I was the sole developer and manager of the web integrations with a title of Web Developer. My role expanded across the server setup, installations, content type migration and module / theme developments.

1. Single employee responsibilities from server setups and configuration to code implementations, maintaining a site running 24/7 worldwide.
2. Develop code, deploy, maintain code base and custom code from 8.7-10.4
3. Redevelop a deprecated theme(nexus) using bootstrap barrio subtheme and bootstrap view module for carousels, cards, tables etc.
4. Implement customized modules that facilitate the website needs such as user api between third party systems - hubspot user creations, email subscriptions with Brevo api double opt-in design landing subscribed url.
5. Implemented customized forms for sales engagement using block placement and page level theme. Emailing features, api connection to Hubspot Forms, internal workflow code via python.
6. Migrated content from an old php site inside drupal via php filter, into proper content types, file system migrations and taxonomy migrations. This includes: Exchange Platform, Technical Presentations, and Events/Conferences using customized code, theming and blocks.
7. Migrated third party CRM into Hubspot CRM using python, mysql, excel and injection techniques to support the company objectives for Jan 2024 go-live.
8. Implement views to display the new content types working within the theme hooks and views data to display subsets of data or full view pages. Twig templates were customized to display the pages as originally designed. Paging and view more configurations as required.
9. Create a module to handle webform remote_post_handler for the two forms that were originally designed and configured. This handler required configuration fields and used in the theme hooks to push through guzzle http requests. json configuration mapped the webform fields as per the below code:


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

## Project Image Gallery
The below screenshots capture some of the modules and components built that visually help relate the modules and features designed and implemented within the site. Customized modules are not accessible to the general public however generalized modules are extended from the general repositories online. 
They represent some areas that are more exclusive the EMTP & web ecosystem. The list and images are non-exhaustive. 

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/emtp/DevicesPDFFileMigrationDisplay.png" title="EMTP Devices correletes with custom download Module" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/emtp/EMTPConferenceAgendaModule.png" title="Conference Agenda module" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/emtp/EMTPEmailModuleBlockModal.png" title="Email Subscription" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    The above set of images are front end displays relative to the code behind for the links to the github modules. Some portions rely on static Block content, and RBA. From Left to right (Custom Download module, Conference Agenda, Email Subscribe Module )
</div>
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/emtp/EMTPRBAConfigViews.png" title="Download Module connected to user RBA functionality" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    The above image is associated with a role based page configuration coupled with different code based on user access. This page module is a admin back end configuration page that appends the html to the the given authentication. Completely configurable. Once the user has the correct privileges, they can download the software using a derivative of the custom_download 
</div>


The below images are related to two form modules. One specific to emtp called `emtp_forms` what displays One Hour Call page block forms and the `webform module` example.


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
