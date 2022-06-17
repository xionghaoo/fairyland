<template>
  <div id="app">
    <Page :index="window.currentIndex"/>
    <video v-if="window.currentIndex === 0" id="video" class="camera" autoplay></video>
  </div>
</template>

<script>
import Page from "@/components/Page";
import WebSocketManager from "@/utils/ws";
import Camera from "@/utils/camera";
import IPC from "@/utils/ipc";

export default {
  name: 'App',
  components: {
    Page
  },
  data() {
    return {
      window: window,
      ws: null,
      camera: null,
      ipc: null
    }
  },
  mounted() {
    let _this = this;
    this.ipc = new IPC();
    this.camera = new Camera(document.getElementById("video"))
    this.ws = new WebSocketManager("ws://120.76.175.224:9002", (data) => {
      // 收到websocket消息
      _this.handleResult(data)
    })

    this.camera.open(() => {
      this.startScan();
    })
  },
  methods: {
    startScan() {
      console.log("开始扫描")
      let _this = this;
      setInterval(() => {
        let imgData = _this.camera.capture();
        if (imgData) {
          _this.ws.send('chinese_ocr', imgData)
        }
      }, 1000);
    },
    handleResult(obj) {
      let model = obj.model;
      let res = obj.result;
      if (res) {
        if (model === 'chinese_ocr') {
          console.log("接收到数据，处理文字结果")
          let success = false;
          // 文字识别
          for (let i = 0; i < res.length; i++) {
            switch (res[i].txt) {
              case 'A':
                console.log("识别到文字： A");
                this.ipc.playContent(0, "production",1);
                success = true;
                break;
                // case 'B':
                //   console.log("识别到文字： B");
                //   this.playContent(1, "production",1);
                //   success = true;
                //   break;
                // case 'C':
                //   console.log("识别到文字： C");
                //   this.playContent(2, "production",1);
                //   success = true;
                //   break;
                // case 'D':
                //   console.log("识别到文字： D");
                //   this.playContent(3, "production",1);
                //   success = true;
                //   break;
            }
          }
          this.hasText = success;
        }
      }
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
.camera {
  position: absolute;
  width: 100px;
  height: 100px;
  left: 0;
  top: 0;
}
</style>
