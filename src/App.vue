<template>
  <div v-if="isInit" id="app">
    <p>幻境Splash</p>
  </div>
  <div v-else-if="hasUpdate" id="app">
    <my-update v-if="window.currentIndex === 0" :value="progress"/>
    <div v-else style="width: 100%; height: 100%">
      <div style="display: block;margin: auto;font-size: 20px">等待更新</div>
    </div>
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
      sections: [],
      successCount: 0
    }
  },
  mounted() {
    let _this = this;
    this.ipc = new IPC();
    this.sections = JSON.parse(localStorage.getItem('sections'))
    this.ws = new WebSocketManager(Config.recognizeApi, (data) => {
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
        console.log('请求更新', res.data)
        // _this.isInit = false
        _this.ipc.setInitStatus(false)
        setTimeout(() => {
          let hasUpdate = res.code === 0
          _this.ipc.setUpdateStatus(hasUpdate)
          // 检查是否有更新
          if (hasUpdate) {
            let rd = res.data
            // 有新的版本
            let resourceUrl = Config.resourceHost + rd.resource_uri
            let sections = JSON.stringify(rd.sections)
            console.log('资源下载路径：' + resourceUrl)
            _this.ipc.onDownloadProgress((progress) => {
              console.log('download progress: ' + progress)
              _this.progress = progress * 0.75
            })
            _this.ipc.onDownloadCompleted(() => {
              // 下载完成
            })
            _this.ipc.onResourceUpdated(() => {
              _this.progress = 100
              // 资源更新完成
              localStorage.setItem('sections', sections)
              _this.sections = rd.sections
              // 保存资源版本号
              localStorage.setItem('version', rd.version_code)

              // 删除多余资源
              // _this.ipc.deleteFiles(_this.sections)

              _this.startTextRecognize()
            })
            _this.ipc.downloadResource(resourceUrl)
          } else {
            // 没有发现新版本
            _this.startTextRecognize()
          }
        }, 100)
      }).catch((e) => {
        console.log(e)
        _this.startTextRecognize()
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
      console.log("开始识别")
      let _this = this;
      setInterval(() => {
        // let sections = this.sections
        // if (sections.length > 0) {
        //   let imgData = _this.camera.capture();
        //   let model = 'chinese_ocr'
        //   if (imgData) {
        //     switch (sections[0].recognize_type) {
        //       case 0:
        //         model = 'chinese_ocr'
        //         break;
        //       case 1:
        //         model = 'aruco'
        //         break;
        //     }
        //   }
        // }
        let imgData = _this.camera.capture();
        // console.log(imgData)
        _this.ws.send("chinese_ocr", imgData)
      }, Config.recognizeInterval);
    },
    handleResult(obj) {
      console.log("处理识别结果", obj)
      // let _this = this;
      let sections = this.sections
      let model = obj.model;
      let res = obj.result;
      if (res) {
        // if (model === 'chinese_ocr') {
        //   let success = false;
        //   // 文字识别
        //   for (let i = 0; i < res.length; i++) {
        //     for (let j = 0; j < sections.length; j++) {
        //       let section = sections[j];
        //       if (section.recognize_type === 0
        //           && res[i].txt.toLowerCase().includes(section.recognize_txt.toLowerCase())) {
        //         console.log("识别到文字：" + section.recognize_txt)
        //         // 匹配到卡片
        //         success = true;
        //         // 匹配到直接把容忍值加满
        //         this.successCount = 3;
        //         this.ipc.playContent(section.screens);
        //       }
        //     }
        //   }
        //   if (success) {
        //     this.successCount ++;
        //     if (this.successCount >= 3) {
        //       this.successCount = 3;
        //     }
        //   } else {
        //     this.successCount --;
        //     if (this.successCount <= 0) {
        //       this.successCount = 0;
        //     }
        //   }
        //   console.log("识别成功次数: " + this.successCount)
        // }
        this.handleTextRecognize(model, res, sections)

        if (this.successCount === 0) {
          this.ipc.playContent([]);
        }
      }
    },
    // 文字识别
    handleTextRecognize(model, res, sections) {
      if (model === 'chinese_ocr') {
        let success = false;
        // 文字识别
        for (let i = 0; i < res.length; i++) {
          for (let j = 0; j < sections.length; j++) {
            let section = sections[j];
            // 检查识别类型
            if (section.recognize_type === 0
                // 检查屏幕数量是否相等
                // && this.ipc.getScreenNum() === section.screens.length
                // 检查识别结果
                && res[i].text.toLowerCase().includes(section.recognize_txt.toLowerCase())) {
              console.log("识别到文字：" + section.recognize_txt)
              // 匹配到卡片
              success = true;
              // 匹配到直接把容忍值加满
              this.successCount = 3;
              this.ipc.playContent(section.screens);
            }
          }
        }
        if (success) {
          this.successCount ++;
          if (this.successCount >= 3) {
            this.successCount = 3;
          }
        } else {
          this.successCount --;
          if (this.successCount <= 0) {
            this.successCount = 0;
          }
        }
        console.log("识别成功次数: " + this.successCount)
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
  height: 100%;
}
html {
  height: 100%;
}
body {
  height: 100%;
}
.camera {
  position: absolute;
  width: 100px;
  height: 100px;
  left: 0;
  top: 0;
}
</style>
