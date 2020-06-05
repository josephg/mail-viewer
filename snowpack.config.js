module.exports = {
    scripts: {
        "mount:public": "mount public --to /",
        "mount:src": "mount src --to /_dist_",
        "mount:cyrus": "mount node_modules/mime-to-jmap/dist/ --to /"

    },

    devOptions: {
        open: "false"
    },

    installOptions: {
        // alias: {
        //     path: './stub.js',
        //     crypto: './stub.js',
        //     fs: './stub.js',
        // }
    },

    plugins: [
        '@snowpack/plugin-svelte'
    ]
}