<template>
  <div v-if="isInit" id="app">
    幻境
  </div>
  <div v-else-if="hasUpdate" id="app">
    <my-update v-if="window.currentIndex === 0" :value="progress"/>
    <div v-else>等待更新</div>
  </div>
  <div v-else id="app">
    <my-content :index="window.currentIndex"/>
    <video v-if="window.currentIndex === 0" id="video" class="camera" autoplay></video>
  </div>
</template>

<script>
import Content from "@/view/Content";
import WebSocketManager from "@/utils/ws";
import Camera from "@/utils/camera";
import IPC from "@/utils/ipc";
import Request from "@/utils/request";
import Config from "@/utils/config";
import Update from "@/view/Update";

export default {
  name: 'App',
  components: {
    'my-update': Update,
    'my-content': Content
  },
  data() {
    return {
      window: window,
      ws: null,
      camera: null,
      ipc: null,
      progress: 0,
      hasUpdate: false,
      isInit: true,
      sections: []
    }
  },
  mounted() {
    let _this = this;
    this.ipc = new IPC();
    this.sections = JSON.parse(localStorage.getItem('sections'))
    this.ws = new WebSocketManager("ws://120.76.175.224:9002", (data) => {
      // 收到websocket消息
      _this.handleResult(data)
    })

    if (window.currentIndex === 0) {
      // 在第一个屏幕检查更新
      this.checkVersionUpdate()
    }
    this.ipc.onInitChange((status) => {
      _this.isInit = status
    })
    this.ipc.onUpdateChange((status) => {
      _this.hasUpdate = status
    })
  },
  methods: {
    checkVersionUpdate() {
      let _this = this;
      let local_version = localStorage.getItem('version') ?? 0
      Request.requestGet(Config.api.versionUpdate, {version: local_version}).then((res) => {
        console.log(res.data)
        // _this.isInit = false
        _this.ipc.setInitStatus(false)
        setTimeout(() => {
          let hasUpdate = res.code === 0
          _this.ipc.setUpdateStatus(hasUpdate)
          // 检查是否有更新
          if (hasUpdate) {
            let rd = res.data
            // 有新的版本
            let resourceUrl = Config.host + rd.resource_uri
            let sections = JSON.stringify(rd.sections)
            console.log('资源下载路径：' + resourceUrl)
            _this.ipc.onDownloadProgress((progress) => {
              console.log('download progress: ' + progress)
              _this.progress = progress
            })
            _this.ipc.onResourceUpdated(() => {
              // 资源更新完成
              localStorage.setItem('sections', sections)
              this.sections = rd.sections
              // 保存资源版本号
              localStorage.setItem('version', rd.version_code)
              _this.startTextRecognize()
            })
            _this.ipc.downloadResource(resourceUrl)
          } else {
            // 没有发现新版本
            _this.startTextRecognize()
          }
        }, 50)
      })
    },
    startTextRecognize() {
      let _this = this;
      // this.hasUpdate = false
      _this.ipc.setUpdateStatus(false)

      setTimeout(() => {
        _this.camera = new Camera(document.getElementById("video"))
        _this.camera.open(() => {
          _this.startScan();
        })
      }, 100)
    },
    startScan() {
      console.log("开始扫描")
      let _this = this;
      setInterval(() => {
        let imgData = _this.camera.capture();
        if (imgData) {
          _this.ws.send('chinese_ocr', imgData)
        }
      }, 10000);
    },
    handleResult(obj) {
      let sections = this.sections
      let model = obj.model;
      let res = obj.result;
      if (res) {
        if (model === 'chinese_ocr') {
          console.log("接收到数据，处理文字结果")
          let success = false;
          // 文字识别
          for (let i = 0; i < res.length; i++) {
            for (let j = 0; j < sections.length; j++) {
              let section = sections[j];
              console.log('section', section);
              if (section.card_name === res[i].txt) {
                console.log("识别到文字")
                // 匹配到卡片
                this.ipc.playContent(section.screens);
              }
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
