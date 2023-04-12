import esbuild from 'esbuild';
import path from 'path';
import { readdir, access, readFile } from 'fs/promises'
import constants from 'constants';
import { parse as dotenvParse } from 'dotenv'


/** @return {{[key:string]: string} | null} */
function extractAllowedKeys(
  /** @type { NodeJS.ProcessEnv | import('dotenv').DotenvParseOutput | {[key:string]: string} | null } */ hash,
  /** @type { string[] | null } */ prefixes,
  )  {
  if (!hash || !prefixes || prefixes.length < 1) return null;
  return Object.keys(hash).
    filter((key) =>  prefixes.map(pre => key.startsWith(pre)).filter(Boolean).length > 0 ).
    reduce((cur, key) => { return Object.assign(cur, { [String(key)]: String(hash[key]) })}, {});
}

/** @return { Promise< {[key:string]: string} | null> } */
async function getEnv(
  /** @type {import('..').Builder['config']['kit']['env']} */ envConfig,
) {
  const filePath = path.join(envConfig.dir, '.env');
  const allowedPrefixes = [envConfig.publicPrefix, 'VITE'];
  try {
    await access(filePath, constants.R_OK);
  } catch (_) {
    return null;
  }  
  const buffer = await readFile(filePath, { flag: constants.O_RDONLY });
  const config = dotenvParse(buffer);
  const allowedConfig = extractAllowedKeys(config, allowedPrefixes);
  const allowedEnv = extractAllowedKeys(process.env, allowedPrefixes);
  if (allowedConfig && allowedEnv) {
    Object.keys(allowedConfig).forEach(key => allowedEnv[key] = allowedConfig[key]);
  }
  return allowedEnv;
}

function buildEnvPlugin(
  /** @type {{[key:string]: string} | null} */ envVars
) {
  return {
      name: 'env',
      /* eslint-disable @typescript-eslint/ban-ts-comment */
      // @ts-ignore no idea what type this is
      setup(build) {
        // Intercept import paths called "env" so esbuild doesn't attempt
        // to map them to a file system location. Tag them with the "env-ns"
        // namespace to reserve them for this plugin.
        build.onResolve({ filter: /^env$/ },
          (
            /* eslint-disable @typescript-eslint/ban-ts-comment */
            // @ts-ignore no idea what type this is
            args
          ) => ({
            path: args.path,
            namespace: 'env-ns',
          })
        )
    
        // Load paths tagged with the "env-ns" namespace and behave as if
        // they point to a JSON file containing the environment variables.
        build.onLoad({ filter: /.*/, namespace: 'env-ns' }, () => ({
          contents: JSON.stringify(envVars),
          loader: 'json',
        }))
      },
    }
}

async function compileContentScripts(
  /** @type {string[]} */ entryFilePaths,
  /** @type {string} */ targetDir,
  /** @type {import('..').Platform} */ platform,
  /** @type {import('..').Builder['config']['kit']['env']} */ envConfig,
) {
  const envVars = await getEnv(envConfig) || {};
  const envPlugin = buildEnvPlugin(envVars);
  await esbuild.build({
		entryPoints: entryFilePaths,
		outdir: targetDir,
		bundle: true,
		format: 'iife',
		platform: 'browser',
		sourcemap: 'inline',
		target: 'es6',
    minify: true,
    define: { OSABEPLATFORM: JSON.stringify(platform) },
    plugins: [ envPlugin ],
	});
}

export default async function buildContentScripts(
  /** @type {import('..').Struct} */ struct,
) {
  const fileToCompileMatcher = /(?<!\.d)\.(js|ts)$/;
  const basePath = path.relative('.', struct.builder.config.kit.env.dir);
  const contentScriptsDir = path.join(basePath, 'src', 'content_scripts');
  const files = await readdir(contentScriptsDir);
  /** @type {string[]} */
  const entryFilePaths = [];
  files.forEach(filePath => filePath.match(fileToCompileMatcher) ? entryFilePaths.push(path.join(contentScriptsDir, filePath)) : false);
  const targetDir = struct.contentScriptPath.absolute;
  struct.builder.mkdirp(targetDir);
  await compileContentScripts(entryFilePaths, targetDir, struct.platform, struct.builder.config.kit.env);
  return;
}