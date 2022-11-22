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
  console.log('host: ' + api)
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
    recognizeInterval: 3000,
    recognizeApi: "ws://120.76.175.224:9001",
    ossHost: 'https://roboland-deliv.ubtrobot.com/',
    recognizeThreshold: 600,
    unConfigThreshold: 5,
    deviceId: "wuhan01",
    api_text_recognize: "https://rvi.ubtrobot.com/aipocket_new/ocr/zh_en/recognition"
    // deviceId: "sz001"
    // recognizeApi: "ws://119.23.154.148:9006"
  }
})();

export default Config;
