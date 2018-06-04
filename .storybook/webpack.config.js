const path = require("path");
const include = [
    path.resolve(__dirname, '../stories'),
    path.resolve(__dirname, '../lib/')
];

module.exports = {
    resolve: {
        extensions: [".ts", ".tsx", ".js"]
    },
    module: {
        rules: [
            {
                test: /\.tsx?/,
                loader: 'babel-loader!awesome-typescript-loader',
                exclude: /node_modules/,
                include
            }
        ]
    }
};