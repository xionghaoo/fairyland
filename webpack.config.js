// webpack 配置文件
// const path = require("path");
//
// module.exports = {
//     mode: "production",
//     entry: {
//         main: "./src/index.js",
//     },
//     output: {
//         path: path.resolve(__dirname, "dist"),
//         filename: "bundle.js",
//     },
//     // *** 模块选项中匹配的文件会通过 loaders 来转换！
//     module: {
//         rules: [
//             // 图片文件
//             {
//                 test: /\.(jpe?g|png|gif|svg|mp4|mov)$/i,
//                 type: "asset", // 一般会转换为 "asset/resource"
//             }
//         ]
//     },
// };