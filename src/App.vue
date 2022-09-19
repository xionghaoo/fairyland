<template>
  <div style="height: 100%">
    <div v-if="isInit" id="app">
      <p>幻境Splash</p>
    </div>
    <div v-else-if="hasUpdate" id="app">
      <my-update v-if="window.currentIndex === 0" :value="progress" :total="totalDownload" :index="downloadIndex"/>
      <div v-else style="width: 100%; height: 100%">
        <div style="display: block;margin-top: 100px;font-size: 20px;background: #2c3e50">等待更新</div>
      </div>
    </div>
    <div v-else id="app">
      <div v-if="company_id">
        <my-content :index="window.currentIndex"/>
        <video v-if="window.currentIndex === 0" id="video" class="camera" autoplay></video>
      </div>
      <div v-else>
        <my-login v-if="window.currentIndex === 0" :callback="loginCallback"/>
        <div v-else style="background: #2c3e50"></div>
      </div>
    </div>
    <!-- 检查安装包更新 -->
    <my-updater v-if="window.currentIndex === 0"/>
  </div>
</template>

<script>
import Content from "@/view/Content";
import Login from "@/view/Login";
import WebSocketManager from "@/utils/ws";
import Camera from "@/utils/camera";
import IPC from "@/utils/ipc";
import Request from "@/utils/request";
import Config from "@/utils/config";
import Update from "@/view/Update";
import Updater from "@/components/Updater";

export default {
  name: 'App',
  components: {
    'my-update': Update,
    'my-updater': Updater,
    'my-content': Content,
    'my-login': Login
  },
  data() {
    let name = this.$router.history.current.name;
    return {
      pageName: name,
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
      play_mode: 0,
      company_id: null
    }
  },
  mounted() {
    this.networkCheck();

    let _this = this;
    this.company_id = localStorage.getItem('company_id');

    this.ipc = new IPC();
    this.sections = JSON.parse(localStorage.getItem('sections'))
    this.ws = new WebSocketManager(Config.recognizeApi, (data) => {
      // 收到websocket消息
      _this.handleResult(data)
    })

    if (window.currentIndex === 0) {
      if (this.company_id) {
        console.log('has login')
        // 已登录
        this.getCardList(this.company_id)
        this.checkVersionUpdate(this.company_id)
        this.ipc.registerShortcutKey()
      } else {
        // 当前未登录
        console.log('need login')
        this.hasUpdate = false
        this.isInit = false
      }
    }
    this.ipc.onShowMessage((args) => {
      this.$message(args);
    })
    this.ipc.onInitChange((status) => {
      _this.isInit = status
    })
    this.ipc.onUpdateChange((status) => {
      _this.hasUpdate = status
    })
  },
  methods: {
    networkCheck() {
      const updateOnlineStatus = () => {
        if (navigator.onLine) {
          console.log('网络已连接')
        } else {
          console.log('网络未连接')
          this.$message({
            message: '网络连接已断开',
            type: 'error'
          })
        }
      }

      window.addEventListener('online', updateOnlineStatus)
      window.addEventListener('offline', updateOnlineStatus)

      updateOnlineStatus()
    },
    loginCallback() {
      this.company_id = localStorage.getItem('company_id');
      this.getCardList(this.company_id)
      this.checkVersionUpdate(this.company_id)
      this.ipc.registerShortcutKey()
    },
    getCardList(company_id) {
      console.log('getCardList')
      Request.requestGet(
          Config.api.cardList,
          { company_id: company_id }
      ).then((res) => {
        console.log('请求卡片列表', res)
        if (res.code === 0) {
          localStorage.setItem('card_list', res.data)
        } else {
          this.$message({
            message: res.data.message,
            type: 'error'
          });
        }
      })
    },
    checkVersionUpdate(company_id) {
      let _this = this;
      let local_version = localStorage.getItem('version') ?? 0
      console.log('checkVersionUpdate', local_version)
      Request.requestGet(
          Config.api.versionUpdate,
          {
            version: local_version,
            // device_uuid: 'wuhan01'
            company_id: company_id
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
                _this.progress = Number(progress.toFixed(0))
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
      _this.ipc.setUpdateStatus(false)

      setTimeout(() => {
        _this.camera = new Camera(document.getElementById("video"))
        _this.camera.open(() => {
          _this.startScan();
        }, () => {
          _this.$message({
            type: "error",
            message: "摄像头连接失败"
          })
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
        let txt = '';
        for (let i = 0; i < res.length; i++) {
          txt += res[i].text
        }
        if (txt !== '') {
          this.handleTextRecognize(model, txt, sections)
        } else {
          this.handleSuccessCount(false)
        }
        if (this.successCount === 0) {
          // 取消播放
          this.ipc.playContent([], null, this.play_mode);
        }
      }
    },
    // 文字识别
    handleTextRecognize(model, recTxt, sections) {
      if (model === 'chinese_ocr') {
        let success = false;
        // 文字识别
        for (let j = 0; j < sections.length; j++) {
          let section = sections[j];
          // 检查识别类型
          if (section.recognize_type === 0
              // 检查识别结果
              && recTxt.toLowerCase().includes(section.recognize_txt.toLowerCase())
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
            let cards = localStorage.getItem('card_list').split(",")
            for (let k = 0; k < cards.length; k++) {
              if (recTxt.toLowerCase() === cards[k].toLowerCase()) {
                success = true
                this.successCount = 2;
                this.ipc.playContent(null, null, 0);
                break;
              }
            }
          }
        }
        this.handleSuccessCount(success)
        console.log("识别成功次数: " + this.successCount)
      }
    },
    handleSuccessCount(success) {
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
