import type { Browser } from "webextension-polyfill";
declare const browser: Browser;

const isChrome = OSABEPLATFORM === 'chrome';
const isMozilla = OSABEPLATFORM === 'mozilla';

fetch(document.location.href)
  .then(resp => {
    const csp = resp.headers.get('Content-Security-Policy');
    if (isMozilla) {
      browser.storage.local.set({ csp });
    } else if (isChrome) {
      console.log('chrome.storage.session.set({ csp });', csp);
      chrome.storage.session.set({ csp });
    }
  });
