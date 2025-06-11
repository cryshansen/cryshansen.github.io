---
layout: page
title: Evolving Web Questionaire
description: A Page that summarizes my website work and custom code Drupal compontents for Drupal websites and custom modules that span the versions from 8.7 through to 11 modules / theme components and integrations. Below are the answers to the questions requested.
img: assets/img/9.jpg
permalink: /projects/drupal-projects/evolve-web/
importance: 1
category: drupal
related_publications: false
---

### Introduction
I specialize in crafting powerful content-driven sites with Drupal. From theme and module development to complex migrations and views customization, my Drupal work is backed by a deep understanding of structured content and accessibility best practices.

What sets me apart: Tailored UX with reusable components, clean preprocess functions, and performance-conscious block rendering.


### Question 1 - Provide a code snippet

The below php file is a configuration page used within the administration back end of a drupal site. I wrote this code so that users with admin privileges could administrate the rotation of api keys for the third party inclusions on the EMTP.com website. The Hubspot and Brevo API connections require keys and other useful information that is repeated on many of the forms on the website and therefore a configuration page could be used across the forms submissions.Lastly, the benefit of the configuration allows to cycle or respond immediately with changes to the api keys in the event that the key is identified in a publicly exposed scenarios.



{% raw %}
```

<?php

/**
 * @file
 * Contains \Drupal\email_subscriber\Form\EmailSubscribeConfigForm.
 */
namespace Drupal\email_subscriber\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Database\Database;

/**
 * Class EmailSubscribeConfigForm.
 */
class EmailSubscribeConfigForm extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return ['email_subscriber.config_form'];
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'email_subscribe_config_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('email_subscriber.config_form');
    //for hubspot functionality the two below are required fields setup requires hubspot forms to link the two systems to the contacts of hubspot and drupal forms
   
    $form['portal_id'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Hubspot portal id'),
      '#description' => $this->t('Enter your Hubspot Portal Id.'),
      '#default_value' => $config->get('portal_id'),
      '#required' => TRUE,
    ];
    $form['hubspot_form_id'] = [
      '#type' => 'textfield',
      '#title' => $this->t('form id'),
      '#description' => $this->t('Enter your hubspot form id.'),
      '#default_value' => $config->get('hubspot_form_id'),
      '#required' => TRUE,
    ];
   
    
    // this scope has content and connection preferences scopes. requires content for the connection preferences https://api.hubapi.com/email/public/v1/subscriptions?portalId=23440935 to succeed.  
   $form['hubspot_unsubscribe_api_key'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Hubspot Unsubscribe API Key'),
      '#description' => $this->t('Enter your Hubspot communication preferences API key.'),
      '#default_value' => $config->get('hubspot_unsubscribe_api_key'),
      '#required' => TRUE,
    ];

     $form['brevo_api_key'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Brevo API Key'),
      '#description' => $this->t('Enter your Brevo API key.'),
      '#default_value' => $config->get('brevo_api_key'),
      '#required' => TRUE,
    ];
    
    return parent::buildForm($form, $form_state);
  }
  
/**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {

    parent::validateForm($form, $form_state);
    
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    parent::submitForm($form, $form_state);

    $this->config('email_subscriber.config_form')
      ->set('brevo_api_key', $form_state->getValue('brevo_api_key'))
      ->set('hubspot_unsubscribe_api_key', $form_state->getValue('hubspot_unsubscribe_api_key'))
       ->set('hubspot_form_id', $form_state->getValue('hubspot_form_id'))
      ->set('portal_id', $form_state->getValue('portal_id'))
      ->save();
  }
}



```
{% endraw %}

### Question 2 Documentation and sustainable code

While I have not participated in tutorials accessible via the web, the overall cryshansen.github.io site is evolving into a project detailed resume site pointing to public repositories of individual code bases similar to in-use customized code from emtp.com. 

To illustrate the care and attention I put into code, documentation and comments, best practices can be examplified with the EMAIL SUBSCRIBER (https://github.com/cryshansen/email_subscriber) repository.
This module contains artifacts of documentation in txt notes to manage the coding challenges. Please see the Readme.md file as well as review the code blocks for comments and inforamation


In my development, I often start with a small module code base that allows me to expand upon. These samples are what I display in my multi-site custom code repositories found at Shared Modules.  Under each module you will find readme files, txt files of necessary database structures or output from testing cycles. More work is required to make each repository instructionable and thoroughly maintained currently it is to get the code visible and useful for resume portfolio needs. 

### Question 3 Top Websites participated in

My drupal experience ranges in the dates of 2009-2010 (v7) and (2021 - 2025) Drupal 8.7-11 PHP8 . Prior to this I worked in vanilla PHP5 content websites during the years of 2006-2007. 

Below I have included the websites i have been actively building in 2025 using drupal and includes my work at EMTP.com which was very extensive in translating and migrating a php site into a drupal system as a security risk for using php filter in ckeditor. 

#### Drupal Websites Collection

- [Site A – EMTP ](/projects/drupal-projects/emtp)
- [Site B – Artog.co](/projects/drupal-projects/artog-co/)
- [Site C – Pinmento.com](/projects/drupal-projects/pinmento/)

General Websites: 

Wordpress:
- [ crystalhansenartographic.ca ](/projects/wp-artographic/)

Vanilla PHP/API booking system:
- [ zackly-rite ](/projects/zackly-rite/)
- [crystalhansenartographic.com](https://crystalhansenartographic.com/)

Please note these linked project pages are still under some development and they will be coming soon with more itemized details to their modules and functionalities.

---

#### Shared Modules

These custom modules are reused across multiple projects and represent an non-exhausted list of modules:

- [Email Subscriber Module](https://github.com/cryshansen/email_subscriber)
- [Star Rating Module](https://github.com/cryshansen/drupal_ratings)
- [Download Module](https://github.com/cryshansen/custom_download)
- [Vector Map Module](https://github.com/cryshansen/custom_vector)
- [Conference Agenda Module](https://github.com/cryshansen/conference_agenda)
- [Conference Leads Module](https://github.com/cryshansen/conference_leads)
- [Map Pins Module](https://github.com/cryshansen/map_pins)
- [Pin Drop Locations ](https://github.com/cryshansen/pin_drop_location)
- [User Profile Account ](https://github.com/cryshansen/user_profile_account)




The emtp.com website I was the sole developer and manager of the web integrations with a title of Web Developer. My role expanded across the server setup, installations, content type migration and module / theme developments.

1. Single employee responsibilities from server setups and configuration to code implementations, maintaining a site running 24/7 worldwide.
2. Develop code, deploy, maintain code base and custom code from 8.7-10.4
3. Redevelop a deprecated theme(nexus) using bootstrap barrio subtheme and bootstrap view module for carousels, cards, tables etc.
4. Implement customized modules that facilitate the website needs such as user api between third party systems - hubspot user creations, email subscriptions with Brevo api double opt-in design landing subscribed url.
5. Implemented customized forms for sales engagement using block placement and page level theme. Emailing features, api connection to Hubspot Forms, internal workflow code via python.
6. Migrated content from an old php site inside drupal via php filter, into proper content types, file system migrations and taxonomy migrations. This includes: Exchange Platform, Technical Presentations, and Events/Conferences using customized code, theming and blocks.
7. Migrated third party CRM into Hubspot CRM using python, mysql, excel and injection techniques to support the company objectives for Jan 2024 go-live.
8. Implement views to display the new content types working within the theme hooks and views data to display subsets of data or full view pages. Twig templates were customized to display the pages as originally designed. Paging and view more configurations as required.
9. Create a module to handle webform remote_post_handler for the two forms that were originally designed and configured. This handler required configuration fields and used in the theme hooks to push through guzzle http requests, json configuration mapped the webform fields.



Please also see the project - emtp by clicking the link above to see more images and context to the emtp.com website.
- [Site A – EMTP ](/projects/drupal-projects/emtp)

### Question 4  A tough technical problem

During my building of the site - pinmento.com, I found that during development, when i switched to my personal laptop, which does not allow location permissions, I needed to provide a solution that falls back elegantly to a default latitude and longitude. I used a variety of tools and techniques to come to a solution. In this case, the best solution seemed to created a configuration file that can have a default added, and if that is not configured, it will resort to the server ip address to establish the pin location. This is not exactly perfect as the user could be anywhere outside the server range in the world but it allows the map to draw with locations so the user can drag or pin elsewhere while google maps renders. A second solution is to build a form that allows a user to enter the country / city via a modal form. This is under construction. 

Please see code in - Pin Drop Locations (https://github.com/cryshansen/pin_drop_location)

### Question 5, 

Yes I am available in Montreal time as I live in Montreal