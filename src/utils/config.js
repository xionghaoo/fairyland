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
  baseUrl = 'http://127.0.0.1'
  let api = baseUrl + ':5000'
  return {
    // 是否是开发环境
    isLocalhost: isLocalhost,
    // 是否测试环境
    isDev: isDev,
    // 打印请求日志
    isPrintLog: isLocalhost,
    // ajax_http请求url
    host: api,
    api: {
      /*-- 基础信息 --*/
      versionUpdate: api + '/fairyland/update',//七牛token

    },
  }
})();

export default Config;