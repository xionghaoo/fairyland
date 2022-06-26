/***
 * 导入配置
 */
import {
  RequestHttpDev,
  RequestHttpPro,
  QiniuUpPath,
  QiniuPathDev,
  QiniuPathPro,
  QiniuPathCommon
} from './../../configBase';

const Config = (() => {
  // 服务器地址
  let url = window.location.origin;
  // 是否是开发环境
  let isLocalhost = url.indexOf('localhost') >= 0 || url.indexOf('192.168') >= 0 || url.indexOf('127.0') >= 0 || url.indexOf('172.') >= 0;
  let isDev = url.indexOf('dev') >= 0 || url.indexOf('test') >= 0;//是否是测试环境

  let requestHttp = isLocalhost || isDev ? RequestHttpDev : RequestHttpPro

  // let apiM = requestHttp + '/m';
  let apiCommon = requestHttp + '/common';
  return {
    // 是否是开发环境
    isLocalhost: isLocalhost,
    // 是否测试环境
    isDev: isDev,
    // 打印请求日志
    isPrintLog: isLocalhost,
    // ajax_http请求url
    api: {
      /*-- 基础信息 --*/
      versionUpdate: apiCommon + '/fairyland/update',//七牛token

    },
    urlOrigin: url, // 当前url
    //七牛地址
    /** //华东地址
     * 服务器端上传：http(s)://up.qiniup.com
     * 客户端上传： http(s)://upload.qiniup.com
     */
    qiniuUpPath: QiniuUpPath, //七牛上传地址（华东地址）up.qiniu.com、up-z0.qiniu.com和upload.qiniu.com
    qiniuPath: isLocalhost || isDev ? QiniuPathDev : QiniuPathPro,//七牛下载地址
    qiniuPathCommon: QiniuPathCommon,
    //授板登录(重新登录)
    accreditLogin() {
      setTimeout(() => {
        window.location.replace('/');
      }, 2000);
    }
  }
})();

export default Config;
