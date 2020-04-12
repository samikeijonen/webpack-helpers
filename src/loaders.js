/**
 * Export generator functions for common Webpack loader configurations.
 */
const deepMerge = require( './helpers/deep-merge' );

/**
 * Export an object of named methods that generate corresponding loader config
 * objects. To customize the default values of the loader, mutate the .defaults
 * property exposed on each method.
 */
const loaders = {
	eslint: ( options ) => deepMerge( loaders.eslint.defaults, options ),

	js: ( options ) => deepMerge( loaders.js.defaults, options ),

	url: ( options ) => deepMerge( loaders.url.defaults, options ),

	style: ( options ) => deepMerge( loaders.style.defaults, options ),

	css: ( options ) => deepMerge( loaders.css.defaults, options ),

	postcss: ( options ) => deepMerge( loaders.postcss.defaults, options ),

	file: ( options ) => deepMerge( loaders.file.defaults, options ),
};

loaders.eslint.defaults = {
	test: /\.jsx?$/,
	exclude: /(node_modules|bower_components)/,
	enforce: 'pre',
	loader: require.resolve( 'eslint-loader' ),
	options: {},
};

loaders.js.defaults = {
	test: /\.jsx?$/,
	exclude: /(node_modules|bower_components)/,
	loader: require.resolve( 'babel-loader' ),
	options: {
		// Cache compilation results in ./node_modules/.cache/babel-loader/
		cacheDirectory: true
	}
};

loaders.url.defaults = {
	test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|eot|ttf)$/,
	loader: require.resolve( 'url-loader' ),
	options: {
		limit: 10000,
	},
};

loaders.style.defaults = {
	loader: require.resolve( 'style-loader' ),
	options: {},
};

loaders.css.defaults = {
	loader: require.resolve( 'css-loader' ),
	options: {
		// We copy fonts etc. using for example Eleventy.
		url: false,
	},
};

loaders.postcss.defaults = {
	loader: require.resolve( 'postcss-loader' ),
	options: {},
};

loaders.file.defaults = {
	// Exclude `js`, `html` and `json`, but match anything else.
	exclude: /\.(js|html|json)$/,
	loader: require.resolve( 'file-loader' ),
	options: {},
};

module.exports = loaders;
