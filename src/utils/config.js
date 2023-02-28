/***
 * 导入配置
 */
import { RequestHttpDev, RequestHttpPro } from '../../configBase';

console.log('env: ', process.env.NODE_ENV);
const baseUrl = process.env.NODE_ENV === 'production' ? RequestHttpPro : RequestHttpDev;
// baseUrl = 'http://192.168.8.130:5002' // TODO 测试
const api = baseUrl + '/api';
console.log('host: ' + api);

export default {
	host: api,
	resourceHost: baseUrl + '/img',
	api: {
		login: api + '/fairyland/login',
		versionUpdate: api + '/fairyland/update',
		cardList: api + '/fairyland/card_list',
		record: baseUrl + '/phantom/sections/recognize_record',
	},
	imageWidth: 1280,
	imageHeight: 960,
	recognizeInterval: 3000,
	recognizeApi: 'ws://120.76.175.224:9001',
	ossHost: 'https://roboland-deliv.ubtrobot.com/',
	recognizeThreshold: 600,
	unConfigThreshold: 5,
	commandThreshold: 3,
	deviceId: 'wuhan01',
	api_text_recognize: 'https://rvi.ubtrobot.com/aipocket_new/ocr/zh_en/recognition',
	// deviceId: "sz001"
	// recognizeApi: "ws://119.23.154.148:9006"
};
