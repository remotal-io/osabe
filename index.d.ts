import { Adapter, Builder } from '@sveltejs/kit';

export { Adapter, Builder };

export declare const OPlatform: {
	readonly chrome: 'chrome',
	readonly mozilla: 'mozilla',
};
export type Platform = typeof OPlatform[keyof typeof OPlatform];

export interface AdapterOptions {
	output: {
		root?: string;
		contentScriptsFolderName?: string;
		externalizedScriptsPrefix?: string;
	},
	input: {
		webAccessibleResources?: string,
		optionsPage?: string,
		popup?: string,
	},	
	fallback?: string;
	strict?: boolean;
	platforms?: Platform[];
	platformPlaceholder?: {
		replace?: boolean;
		expression?: string;
	},
	manifestBuilder?: (manifest: any, platform: string) => any,
}
export type AdapterPlugin = (options?: AdapterOptions) => Adapter;

export type Struct = {
	builder: Builder;
	adapterName: string;
	platform: Platform;
	serviceWorkerFileName: string;
	options: AdapterOptions;
	appPath: string;
	tmpPath: string;
	assetsPath: {
			absolute: string;
			relative: string;
	};
	pagesPath: {
			absolute: string;
			relative: string;
	};
	contentScriptPath: {
		absolute: string;
		relative: string;
	};
}