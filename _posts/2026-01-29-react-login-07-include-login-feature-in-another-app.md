---
layout: post
title: React Login Series - Reusing the Feature in Another App | Part 7
date: 2026-01-29
description: Part 7 Login Series focuses on installation of this feature into any v19 react app.
tags: [react, login, authentication, auth, UI, integration]
categories: [react-posts, auth, react-login-series]
giscus_comments: false
related_posts: true
related_publications: false
featured: false
mermaid:
  enabled: true
  zoomable: true
code_diff: true
---

## Post 7: Reusing the Feature in Another App

Lets walk through droping this feature into any new or existing React apps running on v19. This will help us recap function and app adjustments as well as test the implementation in a new app install.

There is a github shell of React prebuild we prepared and can be used to test our deployment step by step. Grab the shell app code found in post [React Shell]({% post_url 2026-01-02-getting-started-react-app %}) This will ensure we cover all changes and or inclusions required from implementing this. This will help test our instructions for implementation so we can catch any failures and rectify them in test driven deployments. Further we can improve on the feature. In this post We finalize the feature with a review of the Application structure:

## Application Structure Setup

In this post, we download the [main branch](https://github.com/cryshansen/login-feature-react) of the Github repo. The branches were merged to main branch in succession of each post and are tagged in alignment. Therefore the main branch is the full feature for testing the deployment process. This section of the series proves its feature behavior is what we have successfully built and is easy to drop in place. Navigate to your code base and open the feature in your favorite editor, vs code, eclipse.

We will need to adjust the App.jsx and / or Router.jsx by migrating or copying some basic files so the App knows about the feature app and can pass down the neccessary environment variables so that the login routes with your new /base app. Because we have Tailwind installed, we can modify the color scheme to match the App UI via some simple color changes. Our example download is dark mode only set as `true` in most pages which must also be managed. The 'headerTop' file has a darkMode toggle switch for this part. Feel free to either remove or design the light mode via Tailwind UI copies and integrate. This may become a future enhancement. However as is for now, we have dark mode colors schemed and one lightmode for the login for now. Working Toggle will come in v2.

Copy the routes from App.jsx and / or Router.jsx into the new App.jsx and / or Router.jsx files and wrap the AuthProvider around the app in the index.jsx.

This is our finalized layout for a feature auth to drop into any other projects you need a login function for.

```text
src/
├─ app/
│  ├─ App.jsx
│  └─ Router.jsx
│
├─ context/
│  └─ AuthContext.jsx
│
├─ features/
│  └─ auth/
│     ├─ api/
│     │  ├─ schemas/
│     |  │  └─ auth.types.ts
│     |  │  └─ authtelemetry.types.ts
│     │  ├─ services/
│     |  │  └─ auth.service.ts
│     |  │  └─ authTelemetry.service.ts
│     ├─ components/
│     │  ├─ elements/
|     │  │  ├─ AccountDropdown.jsx
|     │  │  └─ DarkMode.jsx
│     │  ├─ forms/
|     │  │  ├─ ConfirmPasswordField.jsx
|     │  │  ├─ ConfirmResetForm.jsx
│     |  │  ├─ EmailField.jsx
|     |  │  ├─ FirstLastNameFields.jsx
|     │  │  ├─ LoginForm.jsx
│     |  │  ├─ OAuthButtons.jsx
│     |  │  ├─ PasswordField.jsx
│     |  │  ├─ PasswordRules.jsx
│     |  │  ├─ PasswordStrengthMeter.jsx
|     │  │  ├─ RequestResetForm.jsx
|     │  │  └─ SignupForm.jsx
│     │  ├─ layout/
|     │  │  ├─ AuthFacingFooter.jsx
|     │  │  ├─ AuthFacingHeader.jsx
|     │  │  ├─ AuthLayout.jsx
|     │  │  ├─ HeaderTopLevel.jsx
|     │  │  ├─ UnAuthFacingHeader.jsx
|     │  │  ├─ UnAuthLayout.jsx
|     |  ├─ utils/
|     |  │  ├─ passwordRules.js
|     |  │  └─ passwordStrength.js
│     ├─ config/
│     |  └─ auth.config.ts
│     ├─ context/
│     |  └─ AuthContext.tsx
│     ├─ pages/
│     │  ├─ AdminPage.test.jsx
│     │  ├─ AuthNotFoundPage.jsx
│     │  ├─ ConfirmEmailPage.jsx
│     │  ├─ ConfirmResetPage.jsx
│     │  ├─ LoginPage.jsx
│     │  ├─ ProfilePage.jsx
│     │  ├─ RequestResetPage.jsx
│     │  └─ SignupPage.jsx
│     ├─ routes/
│     │  ├─ AccountStatusRoute.jsx
│     │  ├─ auth.routes.jsx
│     │  ├─ GuardLoader.jsx
│     │  ├─ ProtectedRoute.jsx
│     │  ├─ PublicOnlyRoute.jsx
│     │  ├─ RoleRoute.jsx
|     |  └─ VerifiedRoute.jsx
│     ├─ tests/
│     │  ├─ auth.service.test.ts
│     │  ├─ AuthContext.contract.test.tsx
│     │  ├─ AuthContext.test.tsx
│     │  ├─ AuthContextEvents.test.tsx
│     │  ├─ ConfirmEmailPage.test.tsx
│     │  ├─ ConfirmResetPage.test.tsx
│     │  ├─ LoginPage.test.jsx
│     │  ├─ RedirectIfAuth.test.tsx
│     │  ├─ RequestPasswordPage.test.jsx
│     │  ├─ RequreAuth.test.jsx
│     │  └─ setup.js
│     │  └─ SignupPage.test.jsx
│     │  ├─ test-utils.jsx
│     │  └─ TestProviders.Tsx
│     ├─ contract.ts
│     └─ index.ts
├─ ui/
│  |─ AppLoader.tsx
│  |─ global-spinner.css
|  └─ GlobalSpinner.tsx
└─ main.jsx

```

## Application Setup Configuration

Open your App.jsx or App.tsx and wrap your App with the features authentication context wrapper

```jsx
import { AuthProvider } from "../features/auth/context/AuthContext.jsx";

return (
  <AuthProvider>
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  </AuthProvider>
);
```

Open your routing file or create one Router.jsx and import the feature's Routes. This will allow the App to use the pre-existing routes for the login feature. Ensure no other routes are using these endpoints:

/login
/reset
/reset/confirm
/signup
/verify

import {AuthRoutes} from "../features/auth/routes/auth.routes";

Wrap the AuthRoutes in this router file like the below:

```jsx
function AppRouter() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <Routes>
      {/* Feature routes */}
      {AuthRoutes({ darkMode, setDarkMode })}

      {/* =====================
          SYSTEM ROUTES
      ===================== */}

      <Route path="/not-found" element={<NotFoundPage darkMode={darkMode} />} />

      {/* Root */}
      <Route path="/" element={<Navigate to="/home" replace />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default AppRouter;
```

This combines the App original pages and functions untouched as we include the Feature.

## Configuring the Environment Variables;

It is advantageous to have evironment variables to allow configuration providing good stability of droping features. We set up the feature to have an .env.example of which you will need to configure

find the file and name it .env
place the proper login api you are using to supply the app feature.
Note that the User_API is none functional at this time. A future variant my provide User based requirements but for this feature and application we have scoped the app to login only with one landing route. It is of no use at this time to point to a user endpoint for this reason.

```jsx
# example file
# .env.example
VITE_AUTH_API_URL=https://api.yourproductiondomain.com/auth
VITE_USER_API_URL=https://api.yourproductiondomain.com/users
VITE_AUTHTEL_API_URL=https://api.yourproductiondomain.com/authtelemetry
```

Open your env.ts file or create it and paste the below. Alternatively you will have it in the downloaded repo

```jsx
// src/config/env.ts
export const API_CONFIG = {
  AUTH_BASE_URL: import.meta.env.VITE_AUTH_API_URL,
  USER_API_URL: import.meta.env.VITE_USER_API_URL,
  AUTHTEL_API_URL: import.meta.env.VITE_AUTHTEL_API_URL,
};
```

There is one more important folder we didnt really cover elsewhere in this series which is moving the Page Loader into a ui folder at the root level. This allows access from both the feature and any app/feature needing a loader. The Loader Requires a root level found in context/LoaderContext.tsx

Topics

What you change

What stays the same

When to extract to a package

So what we have covered to completion is a working authentication feature that is dropin ready. Its updates and interface testing or any api changes make it easy to implement and maintain so as to continually update and redrop upgrades easily. Another benefit is hosting becomes easier for different apps on one cloud storage.

You can grab the finalized [version](https://github.com/cryshansen/login-feature-react) for your inhouse development to extend its capacity to suite your needs. Download drop into a features folder at your root, configure endpoints / routing and done!

Alternatively, if you just want an app prebuild with login incorporated, you can download our test app integration at [base-login-app](https:/github.com/cryshansen/base-login-app)
