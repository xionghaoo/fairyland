/***
 * 导入配置
 */
import {
  RequestHttpDev,
  RequestHttpPro,
} from '../../configBase';

const Config = (() => {
  // 服务器地址
  let url = window.location.origin;
  // 是否是开发环境
  let isLocalhost = url.indexOf('localhost') >= 0 || url.indexOf('192.168') >= 0 || url.indexOf('127.0') >= 0 || url.indexOf('172.') >= 0;
  let isDev = url.indexOf('dev') >= 0 || url.indexOf('test') >= 0;//是否是测试环境

  let baseUrl = isLocalhost || isDev ? RequestHttpDev : RequestHttpPro
  // baseUrl = 'http://119.23.154.148:5007' // 正式地址
  // baseUrl = 'http://10.22.69.72:5001'
  baseUrl = 'http://172.20.10.2:5001'
  // baseUrl = 'http://192.168.8.103:5001'
  let api = baseUrl + '/api'
  return {
    // 是否是开发环境
    isLocalhost: isLocalhost,
    // 是否测试环境
    isDev: isDev,
    // 打印请求日志
    isPrintLog: isLocalhost,
    // ajax_http请求url
    host: api,
    resourceHost: baseUrl + '/img',
    api: {
      /*-- 基础信息 --*/
      versionUpdate: api + '/fairyland/update',
      config: api + '/fairyland/config',

    },
    recognizeInterval: 1000,
    recognizeApi: "ws://120.76.175.224:9001",
    ossHost: 'https://roboland-deliv.ubtrobot.com/',
    recognizeThreshold: 5
    // recognizeApi: "ws://119.23.154.148:9006"
  }
})();

export default Config;
