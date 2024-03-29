// WebSocket
class WebSocketManager {
    constructor(uri, onMessage, onError, onClose) {
        // 变量初始化
        this.hasReceivedResponse = true;

        let ws = new WebSocket(uri);
        this.ws = ws;
        switch (ws.readyState) {
            case WebSocket.CONNECTING:
                console.log("ws正在链接。。。")
                break;
            case WebSocket.OPEN:
                console.log("ws已链接")
                break;
            case WebSocket.CLOSING:
                console.log("ws正在关闭。。。")
                break;
            case WebSocket.CLOSED:
                console.log("ws已关闭。。。")
                break;
            default:
                // this never happens
                break;
        }

        this.ws.onmessage = (event) => {
            this.hasReceivedResponse = true
            let data = event.data;
            // console.log(data);
            // 处理数据
            let obj = JSON.parse(data);
            onMessage(obj)
        }
        this.ws.onerror = function (e) {
            console.log(e.data)
            onError(e.data)
        }
        this.ws.onclose = function (e) {
            console.log('websocket disconnect: ' + e)
            onClose()
        }

    }

    send(img) {
        if (this.hasReceivedResponse) {
            this.hasReceivedResponse = false;
            // this.ws.send(JSON.stringify({"model": model, "image": img}))
            this.ws.send(img)
        }
    }
}

export default WebSocketManager