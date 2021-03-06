/* eslint-disable */

var argv = require('yargs').argv;

process.env.NODE_ENV = 'test';

var webpackConfig = require('./webpack.config');

const webpack = require('webpack');

var path = require('path');

// code which should not impact coverage reports should be listed
// in exclude
webpackConfig.module.rules.push({
        test: /.tsx?$/,
        include: path.resolve(__dirname, 'src/'),
        exclude: [
            /.spec./,
            /\/shared\/api\//
        ],
        enforce:'post',
        loader: 'istanbul-instrumenter-loader'
});

//this will be used by in test context to load corresponding spec files if there is a grep passed (or all if not)
webpackConfig.plugins.push(new webpack.DefinePlugin({
    'SPEC_REGEXP': ('grep' in argv) ? `/${argv.grep}[a-z]*\.spec\./i` : '/\.spec\.(jsx*|tsx*)$/'
}));

webpackConfig.entry = "";

module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['mocha', 'chai'],
        files: [
            {
                pattern: './common-dist/common.bundle.js',
                watched: false,
                served: true
            },
            'tests.webpack.js'
        ],
        preprocessors: {
            // add webpack as preprocessor
            'tests.webpack.js': ['webpack', 'sourcemap'],
        },

        pattern:".spec.",

        webpack: webpackConfig,
        webpackServer: {
            noInfo: true
        },
        webpackMiddleware: {
            // webpack-dev-middleware configuration
            // i. e.
            stats: 'errors-only'
        },

        plugins: [
            'karma-mocha',
            'karma-chai',
            'karma-webpack',
            'karma-phantomjs-launcher',
            'karma-spec-reporter',
            'karma-sourcemap-loader',
            'karma-coverage',
            'karma-coverage-istanbul-reporter'
        ],

        coverageIstanbulReporter: {
            reports: ['text-summary','json-summary','html', 'lcov'],
            dir: './test/fixtures/outputs'
        },

        reporters: ['spec','coverage-istanbul'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_DISABLE,
        browsers: ['PhantomJS'],
        singleRun: !argv.watch,
    });
};
