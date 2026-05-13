---
layout: post
title: React Login Series - Building a Reusable Login Feature | Routing Setup | Part 1a
date: 2025-12-20
description: Part 1 of the React Login Feature walk through covering app setup, dependencies, routing, layouts, and feature-first structure including UI pages & forms for the feature.
tags: [react, login, authentication, auth, signup, reset password, auth flow]
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

## Routing & Setup

This portion of the series concentrates on the routing and Architectural layout for the pages we will require for our system. What is routing? As it sounds, routing allows us to align urls to our page components. We will see this in action through this post as we build out the series. If you havent already, pull the [ github repository ](https://github.com/cryshansen/login-feature-react/tree/post/01-react-login-feature) this is labeled post/01-react-login-feature `branch` of github, to keep going, or have a similar code base as the previous post to ensure ease of further development.

We are ready to define the `Routing.jsx` file and adjust the `App.jsx` file.

Opening the `App.jsx`. It should show the below code with some html like React and Vite logos, a counter state and other text.

```jsx
return <div>....</div>;
```

We need to create a route to pages so we need to remove everything in this file including any state props. The only code we add is related to browser routing to the `App.jsx` file. React has a library called BrowserRouter that is included in the react-router-dom and was why we installed it in the initial installation.
Open the App.jsx and the created Router.jsx. we will make the changes to these files in this tutorial step.

```jsx
import { useState } from "react";

import { BrowserRouter as Router, Routes, Route, BrowserRouter } from "react-router-dom";

import AppRouter from "./Router"; //import your Router file.

function App() {
  const [count, setCount] = useState(0);

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;
```

{: .note}
This step uses the installed dependency of `react-router-dom` handled in our last post. If you see an error try to reinstall it.

This provides our shell of what we need from the general Applications App.jsx usage. It would be expected to have a routing of some sort housed within the application you plan to drop this into. This is what we are building at this time. It may seem a bit redundant but we want to isolate this code as a source for our feature that is tested within a typical architecture.

---

### Prepare For Routing

The next thing required is to build the feature files so that we can create the routes by including these files. This ensures one can copy the routes out and include in their general application file.
We will create the drop in feature layer which comprises of a few folder structures we will go through step by step. We need to wrap the authentication in a layout within a routing layout file and folder. These steps are setup steps for building the feature and testing. We need a way to navigate the user processes through routes. To stay within typical industry standards we add the features structural folders and page requirements. This generally uses header/main/footer html5 structures as well as pages to navigation to. When we are done this step we should have the basic folder structure. Additionally we can create the other pages required and they can stay empty for now.

#### High-Level Architecture

```text
src/
 └─ features/
    └─ auth/
       ├─ components/
       |    ├─ elements/
       |    |  ├─ AccountDropdown.jsx
       |    |  └─ AuthBackground.jsx
       |    |  └─ DarkModeButton.jsx
       |    ├─ layout/
       |      ├─ AuthLayout.jsx
       |      ├─ AuthFacingHeader.jsx
       |      ├─ HeaderToLevel.jsx
       |      └─ AuthFacingFooter.jsx
       ├─ pages/
       │  ├─ ConfirmEmailPage.jsx
       │  ├─ ConfirmResetPage.jsx
       │  ├─ LoginPage.jsx
       │  ├─ NotFoundPage.jsx
       │  ├─ ProfilePage.jsx
       │  ├─ RequestResetPage.jsx
       │  └─ SignupPage.jsx
```

Create these pages and components Open them and save with a basic return. Add a few lines of definition to display a header for each page for now so when we test the routing,the pages are confirmed. Here is a snippet:

```jsx
export default function ConfirmResetPage() {
  return <p>Confirm Reset Page. </p>;
}
```

Do this with all the layout components also so that we see a textual display prior to implementing the UI. It helps us during testing. Once these are all created we can move forward with the routing inclusions.

---

### Completing the Layout Files

Next we will complete the layout files starting with the AuthLayout.jsx which handles the layout of the routes and incorporates the header / main / footer layout design typical of app architecture. First we need a header and footer:
Copy a navigatgion from 3.4 tailwind examples and paste into the appropriate components starting with header
[Tailwind UI Headers ](https://tailwindcss.com/plus/ui-blocks/marketing/elements/headers).

- chose `React` vs `html`
- view `code` toggle,
- switch to `v3.4` ( stable we installed earlier ).
- Copy the code and paste into the `AuthHeader.jsx` file.

The below is incomplete but alternatively find the files in the [ github repo ](https://github.com/cryshansen/login-feature-react/). Review the `Post 1 routing branch` for the sample code as there may be some missing snippet areas within this posts code that have been omitted. In most cases the attempt at notes and use of{/\*_ ... NOTE WHICH FILE TO REFER TO. _/} to signify a review of github code during the explanation process.

```jsx
//AuthFacingHeader.jsx
import React from "react";

 export default function AuthFacingHeader({darkMode}){

  return (
 <header className="bg-gray-900">
      <nav aria-label="Global" className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
        <div className="flex lg:flex-1">
          <a href="#" className="-m-1.5 p-1.5">
            <span className="sr-only">Your Company</span>
            <img
              alt=""
              src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
              className="h-8 w-auto"
            />
          </a>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-400"
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>
        </div>
        {/** check the repo for the full code as this is quite complexe and we are shortening blog real estate.  */}
        ...

        <a href="#" className="text-sm/6 font-semibold text-white">
            Features
          </a>
          <a href="#" className="text-sm/6 font-semibold text-white">
            Marketplace
          </a>
          <a href="#" className="text-sm/6 font-semibold text-white">
            Company
          </a>
      </nav>
    <header>

  );
 }

```

```jsx
// AuthFacingFooter.jsx
import React from "react";

export default function AuthFacingFooter({ darkMode }) {
  return (
    <>
      {/* Footer */}
      <footer
        className={`w-full bg-slate-900 text-slate-300 text-center py-4 transition-colors duration-300 ${
          darkMode ? "bg-brand2-secondary text-brand2-text-secondary" : "bg-brand1-secondary text-brand1-text-secondary"
        }`}
      >
        &copy; 2025 Auth Feature by artog.co
      </footer>
    </>
  );
}
```

Next we set up the `AuthLayout.jsx` to wrap our forms and pages within. Open the `AuthLayout.jsx` file and paste the below code.

```jsx
// AuthLayout.jsx

import React from "react";

import { Outlet } from "react-router-dom";
import HeaderTopLevel from "./HeaderTopLevel"; //<- for dark mode toggle should implement later on tbd can be disabled.
import AuthFacingHeader from "./AuthFacingHeader";
import AuthFacingFooter from "./AuthFacingFooter";

export default function AuthLayout({ darkMode, setDarkMode }) {
  return (
    <div className="min-h-screen flex flex-col w-screen">
      <HeaderTopLevel darkMode={darkMode} />
      <AuthFacingHeader darkMode={darkMode} setDarkMode={setDarkMode} />
      <main className={`flex-1 w-full  ${darkMode ? "bg-slate-800 text-slate-100" : "bg-slate-100 text-slate-900"} bg-slate-800`}>
        {/* <div className="flex flex-1 w-full"> */}
        <div className={` ${darkMode ? "bg-slate-800 text-slate-100" : "bg-slate-100 text-slate-900"} `}>
          <Outlet /> {/* ✅ Child routes render here  aka pages or forms*/}
        </div>
        {/* </div> */}
      </main>

      <AuthFacingFooter />
    </div>
  );
}
```

{: .note}
The code `<Outlet />` enables all the child pages to render via the router url path / element components we will see this below in the routing file

---

### Adjusting the Routing File

Next we adjust the `Router.jsx` file and make routes for our login authentication pages.
To start we add the routes to the Router.jsx file now so that the routing will handle all the layout and page displays. For the below code, we need to create the structure for a login page.

Next with our pages created we can add the files to the Router.jsx file through `import` it as the below illustrates. Notice the AuthLayout wrapper of our urls.

```jsx
import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "../features/auth/pages/LoginPage"; //<-- imported pages import other pages that are listed below in the element={} prop see the github file for verification.

export default function AppRouter() {
  const [darkMode, setDarkMode] = useState(false);
  return (
    <Routes>
      <Route element={<AuthLayout darkMode={darkMode} setDarkMode={setDarkMode} />}>
        <Route path="/login" element={<LoginPage darkMode={darkMode} />} />
        {/** reset password section enter email for reset to be sent to.  */}
        <Route path="/reset" element={<RequestResetPage darkMode={darkMode} />} />
        {/** reset emailed link to confirm the reset similar to 2Step Auth to expose the reset form.  */}
        <Route path="/reset/confirm" element={<ConfirmResetPage darkMode={darkMode} />} />
        {/** end reset password section  */}
        {/** signup section  */}
        <Route path="/signup" element={<SignupPage darkMode={darkMode} />} />
        {/** lander from email link after creating account. */}
        <Route path="/confirm-email" element={<ConfirmEmailPage darkMode={darkMode} />} />
        {/** end signup section link to login */}
      </Route>
      {/* Fallback */}
      <Route path="/not-found" element={<NotFoundPage darkMode={darkMode} />} />
      {/* wildcard catch-all */}
      <Route path="*" element={<Navigate to="/login" />} />. {/** assumes login exists at this time. */}
    </Routes>
  );
}
```

This finalizes the routing process for our feature. we can run this `npm run dev` test that each page displays and the layout header/footer text shows. This will complete the routing part of the post but we need to build out the feature layout also. By testing as we go, we isolate any bugs before moving forward, so we can isolate the issues and run cleanup in test driven development. We can jump to the [tutorial on testing]({% post_url 2026-01-20-react-login-06-testing-login-feature %}) this shell, if you prefer to do an iterative process in your development as a real world workflow but for this tutorial we will move forward with the next steps of Including the html via tailwind UI Layouts.

---

#### Building the AppLayout UI Framework

Lets work on the navigation header footer and main files we created earlier. These would be part of any normal app layout and are designed as support the layout framework for the pages.

Lets complete the AuthLayout.jsx file

create a new folder under `/auth` called `/components` and `/layout`, if you didn't earlier, make sure it looks like this:

```text
auth
  |_components
    |_layout
      |- AuthLayout.jsx

```

add the file code AuthLayout.jsx

```jsx
// AuthLayout.jsx

import React from "react";
import { Outlet } from "react-router-dom";

import HeaderTopLevel from "./HeaderTopLevel";
import AuthFacingHeader from "./AuthFacingHeader";
import AuthFacingFooter from "./AuthFacingFooter";

export default function AuthLayout({ darkMode, setDarkMode }) {
  return (
    <div className="min-h-screen flex flex-col w-screen">
      {/* <HeaderTopLevel darkMode={darkMode} /> */}
      <AuthFacingHeader darkMode={darkMode} setDarkMode={setDarkMode} />
      {/* <div className="flex flex-1 w-full"> */}
      {/* <div className={`${darkMode ? "bg-slate-900 text-slate-100" : "bg-slate-100 text-slate-900"} `}>
              <Outlet /> {/* ✅ Child routes render here */}
      {/*} </div> */}
      {/* </div> */}

      <main className={`flex-1 w-full  ${darkMode ? "bg-slate-800 text-slate-100" : "bg-slate-100 text-slate-900"} bg-slate-800`}>
        {/* <div className="flex flex-1 w-full"> */}
        <div className={` ${darkMode ? "bg-slate-800 text-slate-100" : "bg-slate-100 text-slate-900"} `}>
          <Outlet /> {/* ✅ Child routes render here */}
        </div>
        {/* </div> */}
      </main>

      <AuthFacingFooter />
    </div>
  );
}
```

Notice how we have included a `AuthFacingHeader` header and `AuthFacingFooter` footer components. They also reside within the `auth/components/layout` folder of the feature. We go to tailwind to find a simple navigation layout and include it in the `AuthFacingHeader.jsx` file which is found below using tailwind 3.4 [ Tailwind UI ](https://tailwindcss.com/plus/ui-blocks/application-ui/navigation/navbars)

Copy the file below and copy the react from tailwind as the below is partial since the code can be viewed on tailwind I suggest heading there for the complete copy or just grab our repo later.

```jsx
// AuthFacingHeader.jsx

import React from "react";
import { Sun, Moon, House, Sparkles, BrainCircuit, Bookmark, HeartHandshake } from "lucide-react";
import { Link } from "react-router-dom";

import { useState } from "react";

// ****** heroicons list here: get from code on github.....*****

const products = [
  { name: "Analytics", description: "Get a better understanding of your traffic", href: "#", icon: ChartPieIcon },
  { name: "Engagement", description: "Speak directly to your customers", href: "#", icon: CursorArrowRaysIcon },
  { name: "Security", description: "Your customers’ data will be safe and secure", href: "#", icon: FingerPrintIcon },
  { name: "Integrations", description: "Connect with third-party tools", href: "#", icon: SquaresPlusIcon },
  { name: "Automations", description: "Build strategic funnels that will convert", href: "#", icon: ArrowPathIcon },
];
const callsToAction = [
  { name: "Watch demo", href: "#", icon: PlayCircleIcon },
  { name: "Contact sales", href: "#", icon: PhoneIcon },
];

export default function AuthFacingHeader({ darkMode, setDarkMode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // const {user, logout } = useAuth();
  return (
    <>
      <header className="bg-gray-900">
        <nav aria-label="Global" className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
          <div className="flex lg:flex-1">
            <Link to="/" title="Login Feature Home" alt="Unwind Home" className="-m-1.5 p-1.5">
              <span className="sr-only">Login Feature</span>
              <img alt="" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500" className="h-8 w-auto" />
            </Link>
          </div>
          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-400"
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="size-6" />
            </button>
          </div>
          .....
          <a href="#" className="text-sm/6 font-semibold text-white p-2">
            Features
          </a>
          <a href="#" className="text-sm/6 font-semibold text-white p-2">
            Marketplace
          </a>
          <a href="#" className="text-sm/6 font-semibold text-white p-2">
            Company
          </a>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            <a href="/login" className="text-sm/6 font-semibold text-white">
              Log in <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
          .....
        </nav>
      </header>
    </>
  );
}
```

{: note}
If you hit an error on headlessui or heroicons we need to install these at this time. These are required for the header taken from tailwind UI

```bash
npm install @headlessui/react
npm install @heroicons/react

```

The footer is very basic and doesnt require any installations or fussing. Copy and paste the below directly without issue.

```jsx
AuthFacingFooter.jsx;
import React from "react";

export default function AuthFacingFooter({ darkMode }) {
  return (
    <>
      {/* Footer */}
      <footer
        className={`w-full bg-slate-900 text-slate-300 text-center py-4 transition-colors duration-300 ${
          darkMode ? "bg-brand2-secondary text-brand2-text-secondary" : "bg-brand1-secondary text-brand1-text-secondary"
        }`}
      >
        &copy; 2025 Auth Feature by artog.co
      </footer>
    </>
  );
}
```

---

#### Adding User Dropdown UI

To complete the required elements of a login feature we also need elements like a login icon and account dropdown, we also incorporate the darkMode toggle for future inclusions. If you desire to not use these components, comment out the import `HeaderTopLevel.jsx ` file and included <HeaderTopLevel /> syntax, otherwise we need a couple more elements to go with this part of the UI framework. We need an account dropdown and the toggle.

```jsx
HeaderTopLevel.jsx;
import React from "react";

import { PhoneIcon } from "@heroicons/react/24/outline";
import AccountDropdown from "../elements/AccountDropdown";
import DarkModeButton from "../elements/DarkModeButton";

export default function HeaderTopLevel({ darkMode, setDarkMode, isLoggedIn, logout }) {
  return (
    <header
      className={`
        w-full text-sm
        ${darkMode ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"}
        border-b border-black/5
      `}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-10 items-center justify-between">
          {/* Left: Phone */}
          <div className="flex items-center gap-2">
            <PhoneIcon className="h-4 w-4 text-gray-500" />
            <a href="tel:18001234567" className="hover:underline hidden sm:inline">
              1-800-123-4567
            </a>
          </div>

          {/* Right: Account + Dark Mode */}
          <div className="flex items-center gap-2">
            <AccountDropdown darkMode={darkMode} isLoggedIn={isLoggedIn} logout={logout} />
            <DarkModeButton darkMode={darkMode} setDarkMode={setDarkMode} />
          </div>
        </div>
      </div>
    </header>
  );
}
```

{% raw %}

```jsx
AccountDropdown.jsx;
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CircleUserRound, LogIn, LogOut, User, Coffee, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AccountDropdown({ darkMode, isLoggedIn, logout }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div ref={menuRef} className="relative p-0">
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition bg-transparent
        `}
      >
        <CircleUserRound size={20} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg p-4 z-50
              bg-gray-800 outline outline-1 -outline-offset-1 outline-white/10 transition data-[closed]:translate-y-1 data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-150 data-[enter]:ease-out data-[leave]:ease-in
              ${darkMode ? "bg-slate-800 text-slate-100" : "bg-white text-blue-900"}
            `}
          >
            {/* {!isLoggedIn ? ( */}
            <>
              <Link to="/login" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-400/40 dark:hover:bg-white/5">
                <div className="flex size-8 flex-none items-center justify-center rounded-lg bg-gray-700/50 group-hover:bg-gray-700">
                  <LogIn size={16} aria-hidden="true" className="size-6 text-gray-400 group-hover:text-white" />
                </div>
                <span className="hidden sm:inline block font-semibold text-white hover:text-indigo-500"> Login</span>
              </Link>

              <Link to="/signup" className="flex items-center gap-3 px-4 py-3  rounded-lg hover:bg-slate-400/40 dark:hover:bg-white/5">
                <div className="flex size-8 flex-none items-center justify-center rounded-lg bg-gray-700/50 group-hover:bg-white/5">
                  <User size={18} className="size-6 text-gray-400 group-hover:text-white" />
                </div>
                <span className="hidden sm:inline block font-semibold text-white hover:text-indigo-500"> Create Account</span>
              </Link>
              <hr className="border-slate-600" />
            </>
            {/* ) : ( */}
            <>
              <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-400/40 dark:hover:bg-white/5">
                <div className="flex size-8 flex-none items-center justify-center rounded-lg bg-gray-700/50 group-hover:bg-white/5">
                  <User size={18} className="size-6 text-gray-400 group-hover:text-white" />
                </div>
                <span className="hidden sm:inline block font-semibold text-white hover:text-indigo-500"> Profile</span>
              </Link>
              <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-3 hover:bg-red-300/20 text-red-500">
                <div className="flex size-8 flex-none items-center justify-center rounded-lg bg-gray-700/50 group-hover:bg-white/5">
                  <LogOut size={18} />
                </div>
                <span className="hidden sm:inline block font-semibold text-white hover:text-red-500"> Sign Out </span>
              </button>
            </>
            {/* )} */}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

{% endraw %}

---

Additional files: DarkModeToggle.jsx

```jsx
DarkModeToggle.jsx;
import { Moon, Sun } from "lucide-react";

export default function DarkModeButton({ darkMode, setDarkMode }) {
  darkMode = true;
  return (
    <button onClick={() => setDarkMode(!darkMode)} className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-transparent transition">
      {darkMode ? <Sun size={18} /> : <Moon size={18} />}
      <span className="hidden sm:inline">{darkMode ? "Light" : "Dark"}</span>
    </button>
  );
}
```

Now our `AuthLayout.jsx` should serve the components in the browser. We can test this completion of this post by running `npm run dev` and see the app including these components. Find this code repo on github under post/post-1a-routing-branch [ github routing ](https://github.com/cryshansen/login-feature-react/tree/post/post-1a-routing-branch)

Next up we design the Login and Signup Pages [Tailwind UI Layout]({% post_url 2025-12-23-react-login-01-layout %}).
