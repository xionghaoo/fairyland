import Vue from 'vue';
import Config from './config';

//处理发送前事件
function beforesendHandling(url, data) {
    if (Config.isPrintLog) console.log("【上送url】：\n", url, "\n【上送的数据】：\n", data);
}

//处理完成事件
function completeHandling(data) {
    if (Config.isPrintLog) console.log("【返回的数据】：\n", data);
    if (Number(data.code) == 200) logout(); //登出
    return data;
}

//处理错误事件
function errHandling(err) {
    if (Config.isPrintLog) console.log("【错误信息】：\n", err);
    return {
        code: 520,
        message: '服务器异常，正在努力抢修中'
    };
}

//登出事件
function logout() {
    Config.accreditLogin();//重新授权登录
}

/**
 * get请求
 * @param api
 * @param data
 * @returns {Promise.<Response>}
 */
function requestGet(api, data) {
    let url = api + '?time=' + new Date().getTime();

    for (let item in data) {
        url = url + "&" + item + "=" + encodeURIComponent(data[item]);
    }

    beforesendHandling(url, data);//处理发送前事件

    return Vue.http({
        method: "GET",
        credentials: 'include',
        url: url
    })
        .then(response => {
            return completeHandling(response.data);//处理返回事件
        },
            error => {
                return errHandling(error);
            }
        );
}

/**
 * post请求
 * @param url
 * @param data
 * @returns {Promise.<Response>}
 */
function requestPost(api, data) {
    let url = api + '?time=' + new Date().getTime();

    beforesendHandling(url, data);//处理发送前事件

    let options = {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: {
            'Accept': 'application/json;charset=utf-8',
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(data),
        url: url
    };
    return Vue.http(options)
        .then(response => {
            return completeHandling(response.data);//处理返回事件
        },
            error => {
                return errHandling(error);
            }
        );

}

/**
 * get请求url拼参数
 * @param url
 * @param data
 * @returns {Promise.<Response>}
 */
function requestGetUrlData(api, data) {
    let url = api;

    for (let item in data) {
        url = url + "/" + data[item];
    }

    url = url + '?time=' + new Date().getTime();

    beforesendHandling(url, data);//处理发送前事件

    let options = {
        method: 'GET',
        credentials: 'include',
        url: url
    };
    return Vue.http(options)
        .then(response => {
            return completeHandling(response.data);//处理返回事件
        },
            error => {
                return errHandling(error);
            }
        );

}

export default { requestGet, requestPost, requestGetUrlData };
