const { devServer, stats } = require( './config' );
const deepMerge = require( './helpers/deep-merge' );
const findInObject = require( './helpers/find-in-object' );
const loaders = require( './loaders' );
const plugins = require( './plugins' );
const { ManifestPlugin, MiniCssExtractPlugin } = plugins.constructors;

/**
 * Promote a partial Webpack config into a full development-oriented configuration.
 *
 * This function accepts an incomplete Webpack configuration object and deeply
 * merges any specified options into an opinionated set of development-oriented
 * configuration defaults. This default template is incomplete on its own, and
 * requires at minimum several other properties to be specified in order to
 * create a complete configuration:
 *
 * - an `.entry` object,
 * - an `.output.path` string,
 * - an `.output.publicPath` string (unless a devServer.port is specified,
 *   in which case publicPath defaults to `http://localhost:${ port }`)
 *
 * @param {Object} opts Configuration options to deeply merge into the defaults.
 * @returns {Object} A merged Webpack configuration object.
 */
const development = ( opts = {} ) => {
	/**
	 * Default development environment-oriented Webpack options. This object is
	 * defined at the time of function execution so that any changes to the
	 * `.defaults` loaders properties will be reflected in the generated config.
	 */
	const devDefaults = {
		mode: 'development',

		devtool: 'cheap-module-source-map',

		context: process.cwd(),

		// `path` and `publicPath` should be specified by the consumer.
		output: {
			// Add /* filename */ comments to generated require()s in the output.
			pathinfo: true,
			// Provide a default output name.
			filename: '[name].js',
		},

		module: {
			strictExportPresence: true,
			rules: [
				// Run all JS files through ESLint.
				loaders.eslint(),
				{
					// "oneOf" will traverse all following loaders until one will
					// match the requirements. If no loader matches, it will fall
					// back to the "file" loader at the end of the loader list.
					oneOf: [
						// Process JS with Babel.
						loaders.js(),
						// Convert small files to data URIs.
						loaders.url(),
						// Parse styles using SASS, then PostCSS.
						{
							test: /\.s?css$/,
							use: [
								require.resolve( 'style-loader' ),
								loaders.css( {
									options: {
										sourceMap: true,
									},
								} ),
								loaders.postcss( {
									options: {
										sourceMap: true,
									},
								} ),
								loaders.sass( {
									options: {
										sourceMap: true,
									},
								} ),
							],
						},
						// "file" loader makes sure any non-matching assets still get served.
						// When you `import` an asset you get its filename.
						loaders.file(),
					],
				},
			],
		},

		optimization: {
			nodeEnv: 'development',
		},

		devServer: {
			...devServer,
			stats,
		},

		plugins: [
			plugins.hotModuleReplacement(),
		],
	};

	// Make some general assumptions about the publicPath URI based on the
	// configuration values provided in opts.
	const port = findInObject( opts, 'devServer.port' );
	let publicPath = findInObject( opts, 'output.publicPath' );
	if ( ! publicPath && port ) {
		publicPath = `${
			findInObject( opts, 'devServer.https' ) ? 'https' : 'http'
		}://localhost:${ port }/`;
	}

	// If we had enough value to guess a publicPath, set that path as a default
	// wherever appropriate and inject a ManifestPlugin instance to expose that
	// public path to consuming applications. Any inferred values will still be
	// overridden with their relevant values from `opts`, when provided.
	if ( publicPath ) {
		devDefaults.output.publicPath = publicPath;

		// Check for an existing ManifestPlugin instance in opts.plugins.
		const hasManifestPlugin = plugins.findExistingInstance( opts.plugins, ManifestPlugin );
		// Add a manifest with the inferred publicPath if none was present.
		if ( ! hasManifestPlugin ) {
			devDefaults.plugins.push( plugins.manifest( {
				publicPath,
			} ) );
		}
	}

	return deepMerge( devDefaults, opts );
};

/**
 * Promote a partial Webpack config into a full production-oriented configuration.
 *
 * The function accepts an incomplete Webpack configuration object and deeply
 * merges specified options into an opinionated default production configuration
 * template. This template is incomplete on its own, and requires at minimum
 * several other properties in order to generate a complete configuration:
 *
 * - an `.entry` object,
 * - an `.output.path` string
 *
 * @param {Object} opts Configuration options to deeply merge into the defaults.
 * @returns {Object} A merged Webpack configuration object.
 */
const production = ( opts = {} ) => {
	/**
	 * Default development environment-oriented Webpack options. This object is
	 * defined at the time of function execution so that any changes to the
	 * `.defaults` loaders properties will be reflected in the generated config.
	 */
	const prodDefaults = {
		mode: 'production',

		devtool: false,

		context: process.cwd(),

		// `path` should be specified by the consumer.
		output: {
			pathinfo: false,
			// Provide a default output name.
			filename: '[name].js',
		},

		module: {
			strictExportPresence: true,
			rules: [
				// Run all JS files through ESLint.
				loaders.eslint(),
				{
					// "oneOf" will traverse all following loaders until one will
					// match the requirements. If no loader matches, it will fall
					// back to the "file" loader at the end of the loader list.
					oneOf: [
						// Process JS with Babel.
						loaders.js(),
						// Convert small files to data URIs.
						loaders.url(),
						// Parse styles using SASS, then PostCSS.
						{
							test: /\.s?css$/,
							use: [
								// Extract CSS to its own file.
								MiniCssExtractPlugin.loader,
								// Process SASS into CSS.
								loaders.css(),
								loaders.postcss(),
								loaders.sass(),
							],
						},
						// "file" loader makes sure any non-matching assets still get served.
						// When you `import` an asset you get its filename.
						loaders.file(),
					],
				},
			],
		},

		optimization: {
			minimizer: [
				plugins.terser(),
				plugins.optimizeCssAssets(),
			],
			nodeEnv: 'production',
			noEmitOnErrors: true,
		},

		stats,

		plugins: [],
	};

	// Add a MiniCssExtractPlugin instance if none is already present in opts.
	const hasCssPlugin = plugins.findExistingInstance( opts.plugins, MiniCssExtractPlugin );
	if ( ! hasCssPlugin ) {
		prodDefaults.plugins.push( plugins.miniCssExtract() );
	}

	return deepMerge( prodDefaults, opts );
};

/**
 * Expose all public-facing methods and objects to module consumers.
 *
 * `devConfig()` and `prodConfig()` will generate configuration objects based on
 * opinionated defaults. These default configurations are exposed in `.config`.
 */
module.exports = {
	development,
	production,
};
