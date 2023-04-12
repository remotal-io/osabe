import adapter from '../../index.js';
import { vitePreprocess } from '@sveltejs/kit/vite';
import * as dotenv from 'dotenv';
dotenv.config()



/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		appDir: 'internal',
		serviceWorker: { register: false },
		adapter: adapter({
      manifestBuilder: (manifest, platform) => {
        manifest.name = 'Example App Extension';
        manifest.short_name = 'ExAppEx';
        manifest.version = '0.0.1';
        manifest.description = 'An example demonstrating how to create an extension using SvelteKit+osabe.';
        manifest.homepage_url = 'https://github.com/remotal-io/osabe'
        manifest.icons = {
          128: 'favicon.png' // files should be in static folder
        };
				// For plateform specific settings
        // if (platform === 'chrome') {
				// } else if (platform === 'mozilla') {
				// }
        manifest.permissions = [
          // In order to update the extension icon according to the currently active tab.
          'activeTab',
          // In order to send the content script which will load the UI in the page.
          'scripting',
          // In order to change the CSP to allow our iframe UI to load in the page.
          'declarativeNetRequest',
          // In order to store the original CSP to only add our domain dynamically. Without it we would be forced to add frame-src */* which is a security risk.
          'storage',
          // In order to properly unregister our declarativeNetRequest events
          'management',
        ];
        manifest.host_permissions = [ 'https://*.linkedin.com/*' ];
        manifest.content_scripts = [{
          'matches': [ 'https://*.linkedin.com/*' ],
          'js': [ 'content_scripts/csp_gatherer.js' ]
        }];
        // manifest.externally_connectable = {
        //   'matches': [ process.env.PUBLIC_CSP_DOMAIN+'/*' ]
        // }
        return manifest;
      }
    })
	}
};

export default config;
