<template>
	<div style="height: 100%">
		<div class="fullscreen" v-if="file_type === 0">
			<transition name="el-fade-in-linear">
				<div class="fullscreen" v-show="!isShowNext">
					<img id="img" :src="img_uri" />
				</div>
			</transition>
			<transition name="el-fade-in-linear">
				<div class="fullscreen" v-show="isShowNext">
					<img id="img" :src="next_img_uri" />
				</div>
			</transition>
		</div>
		<video v-else-if="file_type === 1" id="content_video" width="100%" height="100%" :autoplay="auto_play" loop>
			<source :src="video_uri" type="video/mp4" />
			Your browser does not support the video tag.
		</video>
		<iframe width="100%" height="100%" v-else-if="file_type >= 1000" :src="remote_url" title="remote"></iframe>
		<div
			v-else-if="file_type === 2"
			style="
				width: 100%;
				height: 100%;
				background: #2c3e50;
				display: flex;
				justify-content: center;
				align-items: center;
			"
		>
			<!-- 多余屏幕填充内容 -->
		</div>
		<div class="fullscreen" v-else-if="file_type === 3">
			<img id="img" :src="img_no_bind_card" />
		</div>
	</div>
</template>

<script>
import IPC from '@/utils/ipc';
import cover_7_1 from '@/assets/cover_7_1.jpg';
import cover_7_2 from '@/assets/cover_7_2.jpg';
import cover_7_3 from '@/assets/cover_7_3.jpg';
import cover_7_4 from '@/assets/cover_7_4.jpg';
import cover_7_5 from '@/assets/cover_7_5.jpg';
import cover_7_6 from '@/assets/cover_7_6.jpg';
import cover_7_7 from '@/assets/cover_7_7.jpg';
import cover_5_1 from '@/assets/cover_5_1.jpg';
import cover_5_2 from '@/assets/cover_5_2.jpg';
import cover_5_3 from '@/assets/cover_5_3.jpg';
import cover_5_4 from '@/assets/cover_5_4.jpg';
import cover_5_5 from '@/assets/cover_5_5.jpg';
import img_no_bind_card from '@/assets/img_no_bind_card.jpg';
import Request from '@/utils/request';
import Config from '@/utils/config';
import { formatDate } from '@/utils/util';

export default {
	name: 'Content',
	props: {
		index: Number,
	},
	data() {
		return {
			ipc: null,
			img_uri: '',
			video_uri: '',
			next_img_uri: '',
			next_video_uri: '',
			remote_url: '',
			isShowNext: false,
			last_res_url: null,
			file_prefix: '',
			file_type: 0,
			auto_play: false,
			img_no_bind_card: img_no_bind_card,
		};
	},
	created() {
		this.ipc = new IPC();
		let _this = this;
		let path = this.ipc.getPath('documents');
		this.file_prefix = `file:///${path}/Fairyland`;
		this.showDefaultContent();
		this.ipc.onShowContent(screens => {
			if (screens === null) {
				this.file_type = 2;
				return;
			}
			if (screens === 'showNoCard') {
				this.file_type = 3;
				return;
			}
			if (screens.length > 0) {
				let hasMatched = false;
				for (let i = 0; i < screens.length; i++) {
					let s = screens[i];
					// 寻找当前屏幕
					let index = s.index % _this.ipc.getScreenNum();
					// console.log(`getScreenSliceNum: ${_this.ipc.getScreenSliceNum()}`)
					if (index === 0) {
						// 这是最后一个屏幕
						index = _this.ipc.getScreenNum() * Math.floor(screens.length / _this.ipc.getScreenNum());
					}
					if (index === _this.index + 1) {
						hasMatched = true;
						let file_uri = '';
						_this.file_type = s.file_type;
						_this.auto_play = s.auto_play;
						// 匹配到屏幕，获取文件uri
						if (s.file_type < 1000) {
							let tmp = s.item_uri.split('/');
							file_uri = tmp[tmp.length - 1];
						} else {
							file_uri = s.item_uri;
						}
						console.log('play content', s);
						// 把uri赋值给组件
						if (this.last_res_url !== file_uri) {
							let needNext = !_this.isShowNext;
							_this.showContent(_this.file_type, file_uri, needNext);
							_this.isShowNext = needNext;
							_this.last_res_url = file_uri;
						}
					}
				}
				if (!hasMatched) {
					// 没有找到屏幕，显示补充画面
					_this.file_type = 2;
				}
			} else {
				if (_this.last_res_url != null || _this.file_type === 2 || _this.file_type === 3) {
					_this.file_type = 0;
					console.log('显示默认内容');
					_this.showDefaultContent();
					_this.isShowNext = !_this.isShowNext;
					_this.last_res_url = null;
				}
			}
		});
		this.ipc.muteVideo(() => {
			let video = document.getElementById('content_video');
			video.muted = !video.muted;
		});
		this.ipc.toggleVideo(() => {
			// 视频播放暂停
			let video = document.getElementById('content_video');
			if (video) {
				if (video.paused) {
					video.play();
				} else {
					video.pause();
				}
			}
		});
		this.ipc.toggleAllVideo(() => {
			// 视频播放暂停
			let video = document.getElementById('content_video');
			if (video) {
				if (video.paused) {
					video.play();
				} else {
					video.pause();
				}
			}
		});
		this.ipc.onPlayControl(cmd => {
			let video = document.getElementById('content_video');
			if (video) {
				console.log('play control ', cmd);
				switch (cmd) {
					case 'play':
						if (video.paused) video.play();
						break;
					case 'pause':
						video.pause();
						break;
					case 'x1.5':
						video.playbackRate = 1.5;
						if (video.paused) {
							video.play();
						}
						break;
					case 'x1':
						video.playbackRate = 1;
						break;
				}
			}
		});
	},
	methods: {
    /**
     * 显示封面，如果后台没有设置封面，那么本地封面资源
     */
		showDefaultContent() {
			let covers = JSON.parse(localStorage.getItem('covers'));
			if (covers) {
				for (let i = 0; i < covers.length; i++) {
					if (this.$props.index === i) {
						let tmp = covers[i].split('/');
						let file_uri = tmp[tmp.length - 1];
						let url = `${this.file_prefix}/${file_uri}`;
						this.img_uri = url;
						this.next_img_uri = url;
					}
				}
			} else {
				if (this.ipc.getScreenNum() === 4) {
					this.fourScreenCover();
				} else if (this.ipc.getScreenNum() === 5) {
					this.fiveScreenCover();
				} else if (this.ipc.getScreenNum() === 7) {
					this.sevenScreenCover();
				} else {
					this.fourScreenCover();
				}
			}
		},
		fourScreenCover() {
			switch (this.$props.index) {
				case 0:
					this.img_uri = cover_5_1;
					this.next_img_uri = cover_5_1;
					break;
				case 1:
					this.img_uri = cover_5_2;
					this.next_img_uri = cover_5_2;
					break;
				case 2:
					this.img_uri = cover_5_4;
					this.next_img_uri = cover_5_4;
					break;
				case 3:
					this.img_uri = cover_5_5;
					this.next_img_uri = cover_5_5;
					break;
			}
		},
		fiveScreenCover() {
			switch (this.$props.index) {
				case 0:
					this.img_uri = cover_5_1;
					this.next_img_uri = cover_5_1;
					break;
				case 1:
					this.img_uri = cover_5_2;
					this.next_img_uri = cover_5_2;
					break;
				case 2:
					this.img_uri = cover_5_3;
					this.next_img_uri = cover_5_3;
					break;
				case 3:
					this.img_uri = cover_5_4;
					this.next_img_uri = cover_5_4;
					break;
				case 4:
					this.img_uri = cover_5_5;
					this.next_img_uri = cover_5_5;
					break;
			}
		},
		sevenScreenCover() {
			switch (this.$props.index) {
				case 0:
					this.img_uri = cover_7_1;
					this.next_img_uri = cover_7_1;
					break;
				case 1:
					this.img_uri = cover_7_2;
					this.next_img_uri = cover_7_2;
					break;
				case 2:
					this.img_uri = cover_7_3;
					this.next_img_uri = cover_7_3;
					break;
				case 3:
					this.img_uri = cover_7_4;
					this.next_img_uri = cover_7_4;
					break;
				case 4:
					this.img_uri = cover_7_5;
					this.next_img_uri = cover_7_5;
					break;
				case 5:
					this.img_uri = cover_7_6;
					this.next_img_uri = cover_7_6;
					break;
				case 6:
					this.img_uri = cover_7_7;
					this.next_img_uri = cover_7_7;
					break;
			}
		},
		showContent(fileType, uri, isNext = false) {
			switch (fileType) {
				case 0:
					// 图片
					if (!isNext) {
						this.img_uri = `${this.file_prefix}/${uri}`;
					} else {
						this.next_img_uri = `${this.file_prefix}/${uri}`;
					}
					break;
				case 1: {
					// 视频
					this.video_uri = `${this.file_prefix}/${uri}`;
					let video = document.getElementById('content_video');
					let source = document.createElement('source');
					if (video) {
						video.pause();
						// let v = `${this.file_prefix}/${uri}`
						source.setAttribute('src', this.video_uri);
						source.setAttribute('type', 'video/mp4');
						video.load();
						video.play();
						// if (this.index === 3) {
						//   console.log('屏蔽声音')
						//   video.muted = true
						// } else {
						//   video.muted = false
						// }
					}
					break;
				}
				// 网络资源
				case 1000:
				case 1001:
					console.log('设置远程url: ' + uri);
					this.remote_url = uri;
					break;
			}
		},
	},
};
</script>

<style scoped>
#img {
  width: 100%;
  height: 100%;
  object-fit: fill;
}
.fullscreen{
  width: 100%;
  height: 100%;
}
</style>
