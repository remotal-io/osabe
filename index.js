import path from 'path'
import { hostChecker } from './helpers/checkHosts.js'
import checkForDynamicRoutes from './helpers/checkForDynamicRoutes.js'
import checkForBackground from './helpers/checkForBackground.js'
// import checkExternalizedScriptsFolderName from './helpers/checkExternalizedScriptsFolderName.js'
// import checkAssetsFolderName from './helpers/checkAssetsFolderName.js'
import checkCSFolderName from './helpers/checkCSFolderName.js'
import replacePlaceholderExpressionAndMoveSW from './helpers/replacePlaceholderExpressionAndMoveSW.js'
import checkPrerenderedPaths from './helpers/checkPrerenderedPaths.js'
import createContentScriptsFolder from './helpers/createContentScriptsFolder.js'
import buildManifest from './helpers/buildManifest.js'
import createManifest from './helpers/createManifest.js'
import buildContentScripts from './helpers/buildContentScripts.js'
import externalizeScripts from './helpers/externalizeScripts.js'

const contentScriptsFolderNameDefault = 'content_scripts';
const externalizedScriptsPrefixDefault = 'osabe_';
const manifestFilename = 'manifest.json';
const serviceWorkerFileName = 'service-worker.js';

const getOtionsObject = function getOtionsObject(
/** @type {import('.').AdapterOptions | undefined | null} */	options
) {
	const {
		output,
		input,
		strict = true,
		fallback,
		platforms = ['chrome', 'mozilla'],
		platformPlaceholder,
		manifestBuilder = null
	} = options ?? /** @type {import('./index').AdapterOptions} */ ({});

	const root = output?.root || 'build';
	const contentScriptsFolderName = output?.contentScriptsFolderName || contentScriptsFolderNameDefault;
	const externalizedScriptsPrefix = output?.externalizedScriptsPrefix || externalizedScriptsPrefixDefault;

	const webAccessibleResources = input?.webAccessibleResources || 'web_accessible_ressources';
	const optionsPage = input?.optionsPage || 'options_page';
	const popup = input?.popup || 'popup';

	const replace = platformPlaceholder?.replace ?? true;
	const expression = platformPlaceholder?.expression || `Math.random() > 0.5 || "OSABE-PLATEFORM"`;

	return {
		output: {
			root,
			contentScriptsFolderName,
			externalizedScriptsPrefix
		},
		input: {
			webAccessibleResources,
			optionsPage,
			popup
		},
		fallback,
		strict,
		platforms,
		platformPlaceholder: {
			replace,
			expression
		},
		manifestBuilder
	}
}


const buildForPlatform = async function buildForPlateform(
	/** @type {import('.').Struct} */ struct,
) {
	checkForBackground(struct.builder, struct.adapterName, struct.platform);
	struct.builder.writeClient(struct.assetsPath.absolute);
	struct.builder.writePrerendered(struct.pagesPath.absolute);
	await createContentScriptsFolder(struct);
	await replacePlaceholderExpressionAndMoveSW(struct);
	await buildContentScripts(struct);
	await externalizeScripts(struct);
	const manifestContent = await buildManifest(struct);
	await createManifest(manifestContent, struct.pagesPath.absolute, manifestFilename);

	if (struct.options.fallback) {
		struct.builder.generateFallback(path.join(struct.pagesPath.absolute, struct.options.fallback));
	}

	if (struct.pagesPath.absolute === struct.assetsPath.absolute) {
		struct.builder.log(`Wrote files to "${struct.pagesPath.absolute}"`);
	} else {
		struct.builder.log(`Wrote pages to "${struct.pagesPath.absolute}" and assets to "${struct.assetsPath.absolute}"`);
	}
};


/** @type {import('.').AdapterPlugin} */
const adapterPlugin = function adapterPlugin(options) {
	const adapterName = '@remotal-io/opinionated-sveltekit-adapter-browser-extension';
	/** @type {import('.').Adapter} */
	const adapter = {
		name: adapterName,
		async adapt(builder) {
			if (!options?.fallback) {
				checkForDynamicRoutes(
					options?.strict ?? true,
					builder.config.kit.files.routes,
					builder.config.kit.prerender.entries,
					builder.log,
					builder,
				);
			}

			const host = hostChecker.find(platform => platform.test());
			if (host) {
				builder.log.error(
					`Detected ${host.name}. ${name} can not run on this plateform.`
				);
			}

			/** @type {import('.').AdapterOptions} */
			const validOptions = getOtionsObject(options);
			/** @type {import('.').Struct} */
			const struct = {
				builder: null,
				adapterName,
				// @ts-expect-error platform is initialized later
				platform: '',
				serviceWorkerFileName,
				options: validOptions,
				tmpPath: path.join(validOptions.output.root, 'tmp'),
				appPath: builder.getAppPath(),
				assetsPath: {
					absolute: '',
					relative: '',
				},
				pagesPath: {
					absolute: '',
					relative: '',
				},
				contentScriptPath: {
					absolute: '',
					relative: '',
				},
			};

			builder.rimraf(struct.tmpPath);
			builder.rimraf(validOptions.output.root);

			checkPrerenderedPaths(builder.prerendered, builder.log, validOptions.input.webAccessibleResources, adapterName);
			// checkExternalizedScriptsFolderName(builder.log, validOptions.out.externalizedScriptsFolderName, externalizedScriptsFolderNameDefault)
			const validCSFolderName = checkCSFolderName(builder.log, validOptions.output.contentScriptsFolderName, contentScriptsFolderNameDefault)

			builder.writeClient(struct.tmpPath);

			const tmpStructStr = JSON.stringify(struct);
			const promises = validOptions.platforms.map((platform) => {
				/** @type {import('.').Struct} */
				const tmpStruct = JSON.parse(tmpStructStr);
				tmpStruct.builder = builder;
				tmpStruct.platform = platform;
				tmpStruct.options = validOptions;
				tmpStruct.assetsPath.absolute = path.join(validOptions.output.root, platform);
				tmpStruct.pagesPath.absolute = path.join(validOptions.output.root, platform);
				tmpStruct.contentScriptPath.absolute = path.join(tmpStruct.pagesPath.absolute, validCSFolderName);
				tmpStruct.assetsPath.relative = '.' + path.sep;
				tmpStruct.pagesPath.relative = '.' + path.sep;
				tmpStruct.contentScriptPath.relative = '.' + path.sep + path.join(tmpStruct.pagesPath.relative, validCSFolderName);
				return buildForPlatform(tmpStruct);
			})
			await Promise.all(promises);
			builder.rimraf(struct.tmpPath);
			return;
		}
	}
	return adapter;
};


export default adapterPlugin;