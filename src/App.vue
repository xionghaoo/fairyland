<template>
  <div v-if="isInit" id="app">
    <p>幻境Splash</p>
  </div>
  <div v-else-if="hasUpdate" id="app">
    <my-update v-if="window.currentIndex === 0" :value="progress" :total="totalDownload" :index="downloadIndex"/>
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
      totalDownload: 0,
      downloadIndex: 0,
      hasUpdate: false,
      isInit: true,
      sections: [],
      successCount: 0,
      play_mode: 0
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
      this.getCardList()
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
    getCardList() {
      console.log('getCardList')
      Request.requestGet(
          Config.api.cardList,
          { device_uuid: Config.deviceId }
      ).then((res) => {
        console.log('请求卡片列表', res)
        if (res.code === 0) {
          localStorage.setItem('card_list', res.data)
        }
      })
    },
    checkVersionUpdate() {
      let _this = this;
      let local_version = localStorage.getItem('version') ?? 0
      console.log('checkVersionUpdate', local_version)
      Request.requestGet(
          Config.api.versionUpdate,
          {
            version: local_version,
            // device_uuid: 'wuhan01'
            device_uuid: Config.deviceId
          }
      ).then((res) => {
        console.log('请求更新', res)
        // _this.isInit = false
        _this.ipc.setInitStatus(false)
        setTimeout(() => {
          let hasUpdate = res.code === 0
          _this.ipc.setUpdateStatus(hasUpdate)
          // 检查是否有更新
          if (hasUpdate) {
            let rd = res.data
            let sections = JSON.stringify(rd.sections)
            // 下载多个资源文件
            let existFiles = _this.ipc.getDownloadedFiles();
            const urls = []
            for (let i = 0; i < rd.sections.length; i++) {
              let screens = rd.sections[i].screens;
              for (let j = 0; j < screens.length; j++) {
                let nameList = screens[j].item_uri.split("/")
                let name = nameList[nameList.length - 1]
                if (screens[j].file_type < 1000 && !existFiles.includes(name)) {
                  urls.push(Config.ossHost + screens[j].item_uri)
                } else {
                  // 网络资源不用下载
                  // urls.push(screens[j].item_uri)
                }
              }
            }
            console.log("下载资源", urls)
            // 下载资源
            if (urls.length > 0) {
              _this.totalDownload = urls.length
              _this.ipc.onDownloadSingleProgress((index, progress) => {
                console.log(`index: ${index}, progress: ${progress}`)
                _this.progress = progress.toFixed(0)
                _this.downloadIndex = index
              })
              _this.ipc.onDownloadMultiFileCompleted(() => {
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
              _this.ipc.downloadMultiFile(urls)
            } else {
              // 资源更新完成
              localStorage.setItem('sections', sections)
              _this.sections = rd.sections
              // 保存资源版本号
              localStorage.setItem('version', rd.version_code)
              // 删除多余资源
              // _this.ipc.deleteFiles(_this.sections)
              _this.startTextRecognize()
            }
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
        this.handleTextRecognize(model, res, sections)

        if (this.successCount === 0) {
          // 取消播放
          this.ipc.playContent([], null, this.play_mode);
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
                // 检查识别结果
                && res[i].text.toLowerCase().includes(section.recognize_txt.toLowerCase())
                // && res[i].text.toLowerCase() === section.recognize_txt.toLowerCase()
            ) {
              console.log("识别到文字：" + section.recognize_txt)
              // 匹配到卡片
              success = true;
              // 匹配到直接把容忍值加满
              this.successCount = Config.recognizeThreshold;
              // 重置播放模式
              this.play_mode = section.play_mode
              console.log('play_mode: ', section.play_mode)
              // 开始播放
              this.ipc.playContent(section.screens, section.id, this.play_mode);
            } else if (section.recognize_type === 0) {
              // 检查卡片列表中的其他文本
              let resTxt = res[i].text.toLowerCase()
              let cards = localStorage.getItem('card_list')
              for (let k = 0; k < cards.length; k++) {
                if (resTxt.includes(cards[k])) {
                  success = true
                  this.successCount = 2;
                  this.ipc.playContent(null, null, 0);
                  break;
                }
              }
            }
          }
        }
        if (success) {
          this.successCount ++;
          if (this.successCount >= Config.recognizeThreshold) {
            this.successCount = Config.recognizeThreshold;
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
  left: 0;
  top: 0;
}
</style>
