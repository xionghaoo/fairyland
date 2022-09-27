/***
 * 导入配置
 */
import {
  RequestHttpDev,
  RequestHttpPro,
} from '../../configBase';

const Config = (() => {
  let baseUrl = RequestHttpDev;
  if (process.env.NODE_ENV === 'production') {
    baseUrl = RequestHttpPro
  }
  // baseUrl = 'http://192.168.8.130:5002' // TODO 测试
  let api = baseUrl + '/api'
  return {
    // ajax_http请求url
    host: api,
    resourceHost: baseUrl + '/img',
    api: {
      /*-- 基础信息 --*/
      login: api + '/fairyland/login',
      versionUpdate: api + '/fairyland/update',
      cardList: api + '/fairyland/card_list',

    },
    recognizeInterval: 1000,
    recognizeApi: "ws://120.76.175.224:9001",
    ossHost: 'https://roboland-deliv.ubtrobot.com/',
    recognizeThreshold: 5,
    deviceId: "wuhan01"
    // deviceId: "sz001"
    // recognizeApi: "ws://119.23.154.148:9006"
  }
})();

export default Config;
