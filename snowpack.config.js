/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
    mount: {
        public: {url: '/', static: true},
        src: '/dist',
        "node_modules/mime-to-jmap/dist": {url: '/', static: true}
        // "cyrus": "mount node_modules/mime-to-jmap/dist/ --to /",

        // "bundle:*": "@snowpack/plugin-parcel",
    },

    plugins: [
        '@snowpack/plugin-svelte',
        '@snowpack/plugin-parcel'
    ],

    devOptions: {
        open: "false"
    },

    packageOptions: {
        // alias: {
        //     path: './stub.js',
        //     crypto: './stub.js',
        //     fs: './stub.js',
        // }
    },

    homepage: '/mail-viewer'
}