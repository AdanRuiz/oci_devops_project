const path = require('path');

module.exports = {
    webpack: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    style: {
        postcss: {
            mode: "extends",
            loaderOptions: {
                postcssOptions: {
                    ident: 'postcss',
                    plugins: [
                        require('tailwindcss'),
                        require('autoprefixer'),
                    ],
                },
            },
        },
    },
};