<template>
	<div style="height: 100%">
		<div v-if="isInit" id="app">
			<p>幻境Splash</p>
		</div>
		<div v-else-if="hasUpdate" id="app">
			<my-update
				v-if="window.currentIndex === 0"
				:value="progress"
				:total="totalDownload"
				:index="downloadIndex"
			/>
			<div
				v-else
				style="
					width: 100%;
					height: 100%;
					background: #2c3e50;
					display: flex;
					justify-content: center;
					align-items: center;
				"
			>
				<div style="display: block; margin-top: 100px; font-size: 20px; color: white">等待更新</div>
			</div>
		</div>
		<div v-else id="app">
			<div v-if="company_id > 0" style="height: 100%">
				<my-content :index="window.currentIndex" />
				<video v-if="window.currentIndex === 0" id="video" class="camera" autoplay></video>
			</div>
			<div v-else style="height: 100%">
				<my-login v-if="window.currentIndex === 0" :callback="loginCallback" />
				<div
					v-else
					style="
						background: #2c3e50;
						height: 100%;
						display: flex;
						justify-content: center;
						align-items: center;
					"
				>
					<div style="color: white">等待登录</div>
				</div>
			</div>
      <div class="error" v-show="isShowError">
        <div style="color: white">{{ errorMessage }}</div>
      </div>
		</div>
		<!-- 检查安装包更新 -->
		<my-updater v-if="window.currentIndex === 0" />
	</div>
</template>

<script>
import Content from '@/view/Content';
import Login from '@/view/Login';
import Camera from '@/utils/camera';
import IPC from '@/utils/ipc';
import Request from '@/utils/request';
import Config from '@/utils/config';
import Update from '@/view/Update';
import Updater from '@/components/Updater';
import ArucoDetector from '@/utils/arucoDetector';
import {formatDate} from "@/utils/util";
import WebSocketManager from "@/utils/ws";

let timer;
let delays = 1000;
export default {
	name: 'App',
	components: {
		'my-update': Update,
		'my-updater': Updater,
		'my-content': Content,
		'my-login': Login,
	},
	data() {
		let name = this.$router.history.current.name;
		return {
			pageName: name,
			window: window,
			requestCompleted: true,
			camera: null,
			ipc: null,
      detector: null,
			progress: 0,
			totalDownload: 0,
			downloadIndex: 0,
			hasUpdate: false,
			isInit: true,
			sections: [],
			successCount: 0,
			play_mode: 0,
			company_id: null,
      isShowError: false,
      errorMessage: '',
      user_id: null,
      commandCount: 0,
      last_section_id: 0,
      ws: null
		};
	},

	mounted() {
		this.networkCheck();
		let _this = this;
		this.company_id = localStorage.getItem('company_id');
		this.user_id = localStorage.getItem('user_id');

		this.ipc = new IPC();
		this.sections = JSON.parse(localStorage.getItem('sections'));

    if (window.currentIndex === 0) {
      window.cvLoader.then((cv) => {
        this.detector = new ArucoDetector(cv);
        // console.log('cv', cv)
      })
    }

    if (this.company_id) {
      if (window.currentIndex === 0) {
        this.logoutListen();
        console.log('has login');
        // 已登录
        this.getCardList(this.company_id);
        this.checkVersionUpdate(this.company_id, this.user_id);
        this.ipc.registerShortcutKey();
      }
    } else {
      // 当前未登录
      console.log('need login');
      this.hasUpdate = false;
      this.isInit = false;
    }

		this.ipc.onShowMessage(args => {
			_this.$message(args);
		});
		this.ipc.onInitChange(status => {
			_this.isInit = status;
		});
		this.ipc.onUpdateChange(status => {
			_this.hasUpdate = status;
		});
		this.ipc.onCompanyIdUpdate(id => {
			// 更新下每个窗口的状态
			_this.company_id = id;
		});
	},
	beforeUnmount() {
		clearTimeout(timer);
	},
	methods: {
		networkCheck() {
      let _this = this;
			const updateOnlineStatus = () => {
				if (navigator.onLine) {
					console.log('网络已连接');
          _this.showErrorPage(false, '')
				} else {
					console.log('网络未连接');
					_this.$message({
						message: '网络连接已断开',
						type: 'error',
					});
          _this.showErrorPage(true, '网络连接已断开')
				}
			};

			window.addEventListener('online', updateOnlineStatus);
			window.addEventListener('offline', updateOnlineStatus);

			updateOnlineStatus();
		},
		logoutListen() {
			// let _this = this;
			this.ipc.onLogout(() => {
				// console.log('logout');
				// _this.hasUpdate = false;
				// _this.isInit = false;
				// _this.ipc.setCompanyId(null);
			});
		},
		loginCallback() {
			this.company_id = localStorage.getItem('company_id');
			this.user_id = localStorage.getItem('user_id');
			this.ipc.setCompanyId(this.company_id);
			this.getCardList(this.company_id);
			this.checkVersionUpdate(this.company_id, this.user_id);
			this.ipc.registerShortcutKey();
		},
		getCardList(company_id) {
			console.log('getCardList');
			Request.requestGet(Config.api.cardList, { company_id: company_id }).then(res => {
				console.log('请求卡片列表', res);
				if (res.code === 0) {
					localStorage.setItem('card_list', res.data);
				} else {
          console.log(res.message)
				}
			});
		},
		checkVersionUpdate(company_id, user_id) {
			let _this = this;
			let local_version = localStorage.getItem('version') ?? 0;
			console.log('checkVersionUpdate', local_version);
			Request.requestGet(Config.api.versionUpdate, {
				version: local_version,
				company_id: company_id,
        user_id: user_id
			}).then(res => {
					console.log('请求更新', res);
					// _this.isInit = false
					_this.ipc.setInitStatus(false);
					setTimeout(() => {
						let hasUpdate = res.code === 0;
						_this.ipc.setUpdateStatus(hasUpdate);
						// 检查是否有更新
						if (hasUpdate) {
							let rd = res.data;
							// 封面资源
							let coverUrls = [];
							let thisDeviceScreenNum = _this.ipc.getScreenNum();
							let covers = rd.covers;
							for (let i = 0; i < covers.length; i++) {
								if (covers[i].screen_num === thisDeviceScreenNum && covers[i].cover_images) {
									let nameList = covers[i].cover_images.split(',');
									for (let j = 0; j < nameList.length; j++) {
										coverUrls.push(Config.ossHost + nameList[j]);
									}
									// 保存封面
									localStorage.setItem('covers', JSON.stringify(nameList));
									break;
								}
							}
							// 案例资源
							let sections = JSON.stringify(rd.sections);
							// 下载多个资源文件
							let existFiles = _this.ipc.getDownloadedFiles();
							const sectionUrls = [];
							for (let i = 0; i < rd.sections.length; i++) {
								let screens = rd.sections[i].screens;
								for (let j = 0; j < screens.length; j++) {
									let nameList = screens[j].item_uri.split('/');
									let name = nameList[nameList.length - 1];
									if (screens[j].file_type < 1000 && !existFiles.includes(name)) {
										sectionUrls.push(Config.ossHost + screens[j].item_uri);
									} else {
										// 网络资源不用下载
										// urls.push(screens[j].item_uri)
									}
								}
							}

							let urls = coverUrls.concat(sectionUrls);
							console.log('下载资源', urls);
							// 下载资源
							if (urls.length > 0) {
								_this.totalDownload = urls.length;
								_this.ipc.onDownloadSingleProgress((index, progress) => {
									console.log(`index: ${index}, progress: ${progress}`);
									_this.progress = Number(progress.toFixed(0));
									_this.downloadIndex = index;
								});
								_this.ipc.onDownloadMultiFileCompleted(() => {
									_this.progress = 100;
									// 资源更新完成
									localStorage.setItem('sections', sections);
									_this.sections = rd.sections;
									// 保存资源版本号
									localStorage.setItem('version', rd.version_code);
									// 删除多余资源
									// _this.ipc.deleteFiles(_this.sections)
									_this.startTextRecognize();
								});
								_this.ipc.downloadMultiFile(urls);
							} else {
								// 资源更新完成
								localStorage.setItem('sections', sections);
								_this.sections = rd.sections;
								// 保存资源版本号
								localStorage.setItem('version', rd.version_code);
								console.log('没有新的资源');
								_this.startTextRecognize();
							}
						} else {
							// 没有发现新版本
							console.log('没有新版本');
							_this.startTextRecognize();
						}
					}, 100);
				})
				.catch(e => {
					console.error(e);
					_this.startTextRecognize();
				});
		},
		startTextRecognize() {
			let _this = this;
			_this.ipc.setUpdateStatus(false);
      _this.tryStartCamera(50)
		},
    tryStartCamera(timeout) {
      let _this = this;
      setTimeout(() => {
        _this.camera = new Camera(document.getElementById('video'));
        _this.camera.open(
            () => {
              _this.showErrorPage(false, '')
              _this.startScan();
            },
            () => {
              _this.$message({
                type: 'error',
                message: '摄像头连接失败',
              });
              _this.showErrorPage(true, '摄像头连接错误')
              _this.tryStartCamera(2000)
            },
        );
      }, timeout);
    },
    showErrorPage(isShow, msg) {
      this.isShowError = isShow;
      this.errorMessage = msg;
    },
		startScan() {
			console.log('开始识别');
			let _this = this;
      this.ws = new WebSocketManager(
          "ws://localhost:8765",
          res=> {
            // setDelays();
            console.log(res)
            if (res.code === 100 && res.data) {
              _this.handleTwoLineRecognizeText(res.data);
            } else {
              _this.handleSuccessCount(false);
            }
          },
          err=>{
            // setDelays();
            console.log(err);
            _this.$message({
              type: 'error',
              message: err,
            });
          },
          () => {
          }
      )

      _this.requestTextRec();
		},
		requestTextRec() {
			let _this = this;
      _this.camera.capture((imgData, canvas) => {
        const startTime = Date.now();
        // aruco码检测
        let code = _this.detector ? _this.detector.detect(canvas) : null
        if (code > 0) {
          // 识别到aruco码
          // setDelays()
          this.handleArucoCode(code)
        } else {
          this.clearCommandCount()

          // 文字检测
          // Request.requestPost(Config.api_text_recognize, { image_base64: imgData }).then(
          //     res => {
          //       setDelays();
          //       if (res.code === 0 && res.data) {
          //         _this.handleTwoLineRecognizeText(res.data);
          //       } else {
          //         _this.handleSuccessCount(false);
          //       }
          //     },
          //     err => {
          //       setDelays();
          //       console.log(err);
          //       _this.$message({
          //         type: 'error',
          //         message: err,
          //       });
          //     },
          // );
          this.ws.send(imgData)
        }

        // function setDelays() {
        //   const times = Date.now() - startTime;
        //   console.log('Reply Time: ', times);
        //   delays = times < 1000 ? 1000 : times;
        // }
      });

			timer = setTimeout(_this.requestTextRec.bind(_this), 2000);
		},
    // Aruco码处理
    handleArucoCode(code) {
      console.log('find aruco code: ', code)
      switch (code) {
        case "10":
          this.commandCount = Config.commandThreshold
          this.ipc.sendPlayControl("play")
          return;
        case "20":
          this.commandCount = Config.commandThreshold
          this.ipc.sendPlayControl("pause")
          return;
        case "30":
          this.commandCount = Config.commandThreshold
          this.ipc.sendPlayControl("x1.5")
          return;
        default:
          this.clearCommandCount()
          break;
      }
      this.handleTwoLineRecognizeText([
        {text: code}
      ])
    },
    clearCommandCount() {
      this.commandCount --;
      if (this.commandCount <= 0) {
        this.ipc.sendPlayControl("x1")
      }
    },
    handleTwoLineRecognizeText(data) {
      console.log('待匹配文本', data)
      let success = false;
      let section = this.matchSection(data);
      if (section) {
        success = true;

        // 匹配到直接把容忍值加满
        this.successCount = Config.recognizeThreshold;
        // 重置播放模式
        this.play_mode = section.play_mode;
        // 给页面添加自动播放模式
        for (let i = 0; i < section.screens.length; i++) {
          section.screens[i].auto_play = section.auto_play;
        }
        if (this.last_section_id !== section.id) {
          this.last_section_id = section.id;
          console.log('record data: ', section.id);
          // TODO 提交扫描记录
          // Request.requestPost(Config.api.record, {
          //   section_id: section.id,
          //   qrcode_type: 'active',
          //   operator_time: formatDate(new Date()),
          // });
        }
        // 开始播放
        this.ipc.playContent(section.screens, section.id, this.play_mode);
      } else {
        // 识别未配置卡片
        let card = this.matchUnConfigCard(data);
        if (card) {
          // 匹配到未配置卡片
          success = true;
          this.successCount = Config.unConfigThreshold;
          console.log("匹配到未配置卡片: " + card)
          this.ipc.playContent(null, -1, 0);
        }
      }
      this.handleSuccessCount(success);
    },
    /**
     * 两行文本匹配，识别以章节标识为主要匹配顺序，卡片文本为次要匹配顺序
     * 场景一：卡片<优必选>和<华师>同时放置在摄像头下，当章节标识顺序为<华师><优必选>时，会命中<华师>
     * 精确匹配：选一行或两行进行精确匹配，比如：优必选 -> 优必选，优必选 -> 优必\n选
     * 模糊匹配：选一行或两行进行模糊匹配，比如: 优必选 -> 深圳优必选公司，优必选科技 -> 深圳优必选\n科技公司
     * @param data
     * @returns {null|*}
     */
    matchSection(data) {
      let sections = this.sections;
      for (let i = 0; i < sections.length; i++) {
        let section = sections[i];
        // 章节标识文本
        let sectionTxt = sections[i].recognize_txt.toLowerCase();
        // 识别到的文本列表
        for (let j = 0; j < data.length; j++) {
          let line = data[j].text.toLowerCase();
          if (section.recognize_type === 0) {
            // 精确匹配
            if (sectionTxt === line) {
              // 单行精确命中
              return section;
            } else if (sectionTxt.includes(line) && j < data.length - 1) {
              // 章节标识文本包含行，尝试继续匹配下一行
              let mergeLine = (data[j].text + data[j + 1].text).toLowerCase();
              if (sectionTxt === mergeLine) {
                // 两行精确命中
                return section;
              }
            }
            // 模糊匹配
           /* if (line.includes(sectionTxt)) {
              // 单行模糊命中
              return section
            } else if (j < data.length - 1) {
              let mergeLine = (data[j].text + data[j + 1].text).toLowerCase();
              if (mergeLine.includes(sectionTxt)) {
                // 两行模糊命中
                return section;
              }
            }*/
          }
        }
      }
      return null;
    },
    /**
     * 匹配未配置文本
     * @param data
     * @returns {string|null}
     */
    matchUnConfigCard(data) {
      let cards = localStorage.getItem('card_list').split(',');
      for (let i = 0; i < cards.length; i++) {
        let cardTxt = cards[i].toLowerCase();
        // 识别到的文本列表
        for (let j = 0; j < data.length; j++) {
          let line = data[j].text.toLowerCase();
          if (cardTxt === line) {
            // 匹配到章节
            return cardTxt;
          } else if (cardTxt.includes(line) && j < data.length - 1) {
            // 章节标识文本包含行，尝试继续匹配下一行
            let mergeLine = (data[j].text + data[j + 1].text).toLowerCase();
            if (cardTxt === mergeLine) {
              // 匹配到章节
              return cardTxt;
            }
          }

          // 模糊匹配
          /*if (line.includes(cardTxt)) {
            // 单行模糊命中
            return cardTxt
          } else if (j < data.length - 1) {
            let mergeLine = (data[j].text + data[j + 1].text).toLowerCase();
            if (mergeLine.includes(cardTxt)) {
              // 两行模糊命中
              return cardTxt;
            }
          }*/
        }
      }
      return null;
    },
		handleSuccessCount(success) {
			if (success) {
				this.successCount++;
				if (this.successCount >= Config.recognizeThreshold) {
					this.successCount = Config.recognizeThreshold;
				}
			} else {
				this.successCount--;
				if (this.successCount <= 0) {
					this.successCount = 0;
				}
			}

      if (this.successCount === 0) {
        // 取消播放
        this.ipc.playContent([], null, this.play_mode);
      }
      console.log('识别成功消耗值: ' + this.successCount);
    },
	},
};
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
.error {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  background: #cc4a5c;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 30px;
}
</style>
