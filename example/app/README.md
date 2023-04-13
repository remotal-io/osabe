# Example App

An advanced working example of an extension that allows you to display an iframe in LinkedIn containing your website.

## What does it do?

- On click on the action icon, it displays an iframe inside LinkedIn (by injecting a content script).
- It changes the action icon (gray/orange) when on linkedin (via the service-worker).
- It adds an option page to the extension.
- When loading a LinkedIn page, it catches its CSP, then changes them on the next load to allow the iframe to be loaded, by using the declarativeNetRequest API.
  - When the extension is deactivated or uninstalled it removes the DynamicRules that were setup

## TODO Before building this example

### Env

Create a `.env` file such as:

```sh
# DEV
PUBLIC_CSP_DOMAIN=https://127.0.0.1:*
# use VITE_* in service-worker until this enhancement is merge: https://github.com/sveltejs/kit/issues/5717
VITE_PUBLIC_CSP_DOMAIN=https://127.0.0.1:*

# This var is used in set_iframe.ts
PUBLIC_HOMEPAGE=https://127.0.0.1:5173/app
```

If you don't have a local website to try, here is one that will work

```sh
# DEV
PUBLIC_CSP_DOMAIN=https://www.remotal.io
# use VITE_* in service-worker until this enhancement is merge: https://github.com/sveltejs/kit/issues/5717
VITE_PUBLIC_CSP_DOMAIN=https://www.remotal.io

# This var is used in set_iframe.ts
PUBLIC_HOMEPAGE=https://www.remotal.io

```

## Building

To build your app:

```bash
npm run build
# OR
npm run build-watch
```
