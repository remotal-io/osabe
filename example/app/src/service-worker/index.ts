import { isChrome, isMozilla } from './platform';
import Browser from 'webextension-polyfill';
import type { Tabs } from 'webextension-polyfill';

// When https://github.com/sveltejs/kit/issues/5717 is merged, use import instead.
// import { PUBLIC_CSP_DOMAIN } from '$env/static/public';
const PUBLIC_CSP_DOMAIN = import.meta.env.VITE_PUBLIC_CSP_DOMAIN;

function onActionClicked(tab: Browser.Tabs.Tab/*, _: Browser.Action.OnClickData | undefined*/) {
  if (!tab.id) return;
  Browser.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content_scripts/set_iframe.js']
  });
}

function setActionPin(tab: Tabs.Tab, enable = true) {
  if (enable) {
    if (!Browser.action.onClicked.hasListener(onActionClicked)) {
      Browser.action.onClicked.addListener(onActionClicked);
    }
    Browser.action.enable(tab.id);
    Browser.action.setIcon({path: 'favicon-orange.png', tabId: tab.id } );
  } else {
    if (Browser.action.onClicked.hasListener(onActionClicked)) {
      Browser.action.onClicked.removeListener(onActionClicked);
    }
    Browser.action.disable(tab.id);
    Browser.action.setIcon({path: 'favicon.png', tabId: tab.id } );
  }
}

function isLinkedIn(urlString: string | undefined) {
  if (!urlString) return false;
  const supportedHostnames = ["linkedin.com"];
  const supportedProtocols = ["https:", "http:"];
  const url = new URL(urlString);
  let hostnameFound = false;
  supportedHostnames.forEach(hn => {
    if (url.hostname.includes(hn)) {
      hostnameFound = true;
    }
  })
  return supportedProtocols.indexOf(url.protocol) != -1 && hostnameFound;
}

/*
 * Switches currentTab and currentBookmark to reflect the currently active tab
 */
function updateActiveTab() {
  function updateTab(tabs: Tabs.Tab[]) {
    if (tabs[0]) {
      const currentTab = tabs[0];
      const urlString = currentTab.url;
      if (urlString && isLinkedIn(urlString)) {
        setActionPin(currentTab, true);
      } else {
        setActionPin(currentTab, false);
      }
    }
  }

  const gettingActiveTab = Browser.tabs.query({ active: true, currentWindow: true });
  gettingActiveTab.then(updateTab);
}

function augmentFrameSrc(policies: string[]) {
  const policyIndex = policies.findIndex(policy => policy.match(/\s?frame-src/));
  if (policies[policyIndex].includes(PUBLIC_CSP_DOMAIN)) return;
  policies[policyIndex] = policies[policyIndex] + ' ' + PUBLIC_CSP_DOMAIN;
}
function augmentConnectSrc(policies: string[]) {
  const policyIndex = policies.findIndex(policy => policy.match(/\s?connect-src/));
  if (policies[policyIndex].includes(PUBLIC_CSP_DOMAIN)) return;
  policies[policyIndex] = policies[policyIndex] + ' ' + PUBLIC_CSP_DOMAIN;
}
function augmentScriptSrc(policies: string[]) {
  const policyIndex = policies.findIndex(policy => policy.match(/\s?script-src/));
  if (policies[policyIndex].includes(PUBLIC_CSP_DOMAIN)) return;
  policies[policyIndex] = policies[policyIndex] + ' ' + PUBLIC_CSP_DOMAIN;
}
function augmentStyleSrc(policies: string[]) {
  const policyIndex = policies.findIndex(policy => policy.match(/\s?style-src/));
  if (policies[policyIndex].includes(PUBLIC_CSP_DOMAIN)) return;
  policies[policyIndex] = policies[policyIndex] + ' ' + PUBLIC_CSP_DOMAIN;
}

function updateCSP(csp: string) {
  const policies = csp.split(';');
  augmentFrameSrc(policies);
  augmentConnectSrc(policies);
  augmentScriptSrc(policies);
  augmentStyleSrc(policies);
  const newPolicies = policies.join(';');
  const rule: Browser.DeclarativeNetRequest.Rule = {
    id : 1,
    priority: 1,
    action: {
      type: 'modifyHeaders',
      responseHeaders: [
        { 'header': 'content-security-policy', 'operation': 'set', 'value': newPolicies }
      ]
    },
    condition : {
      urlFilter : 'https://*.linkedin.com/*',
      resourceTypes : [ 'main_frame' ],
      requestDomains: [ 'linkedin.com' ],
    }
  };

  Browser.declarativeNetRequest.updateDynamicRules(
    {
      removeRuleIds: [ 1 ],
      addRules: [ rule ]
    }
  );
  return newPolicies;
}
function localStorageOnChanged(changes: {[key: string]: chrome.storage.StorageChange}) {
  console.log(changes);
  if (changes.csp?.newValue && (changes.csp.newValue !== changes.csp.oldValue)) {
    updateCSP(changes.csp.newValue)
  }
}


// listen to tab URL changes
Browser.tabs.onUpdated.addListener(updateActiveTab);
// listen to tab switching
Browser.tabs.onActivated.addListener(updateActiveTab);
// listen for window switching
Browser.windows.onFocusChanged.addListener(updateActiveTab);
// listen for extension installation
// Browser.runtime.onInstalled.addListener(setupActions)

// As of Feb 2023, in chrome, chrome.storage.local.onChanged will not fire when changed from a content script
// But chrome.storage.session.onChanged will, so we use that one
console.log('before Storage', {isMozilla, isChrome});
const Storage = isChrome ? chrome.storage.session : (isMozilla ? Browser.storage.local : Browser.storage.local)
if (isMozilla) {
  console.log('NOT TRUSTED_AND_UNTRUSTED_CONTEXTS');
  Storage.onChanged.addListener(localStorageOnChanged);
} else if (isChrome) {
  console.log('TRUSTED_AND_UNTRUSTED_CONTEXTS');
  (Storage as chrome.storage.SessionStorageArea).setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' });
  Storage.onChanged.addListener(localStorageOnChanged);
}


// update when the extension loads initially
updateActiveTab();




function removeDeclarativeNetRequestDynamicRules() {
  // Ensures the DynamicRules are removed when extension is disabled or uninstalled
  // Doesn't seem to be true as as Feb 2023
  Browser.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [1, 2] });
  Storage.remove('csp');
}
if (!Browser.management.onDisabled.hasListener(removeDeclarativeNetRequestDynamicRules)) {
  Browser.management.onDisabled.addListener(removeDeclarativeNetRequestDynamicRules);
}
if (!Browser.management.onUninstalled.hasListener(removeDeclarativeNetRequestDynamicRules)) {
  Browser.management.onUninstalled.addListener(removeDeclarativeNetRequestDynamicRules);
}
