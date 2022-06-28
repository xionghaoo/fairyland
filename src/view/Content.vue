<template>
  <div>
    <transition name="el-fade-in-linear">
      <div v-show="!isShowNext">
        <img v-if="file_type === 0" :src="require(`@/assets/${img_uri}`)" width="100%" height="100%">
        <video v-else-if="file_type === 1" id="content_video" width="100%" height="100%" autoplay loop>
          <source :src="require(`@/assets/${video_uri}`)" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      </div>
    </transition>
    <transition name="el-fade-in-linear">
      <div v-show="isShowNext">
        <img v-if="file_type === 0" :src="require(`@/assets/${next_img_uri}`)" width="100%" height="100%">
        <video v-else-if="file_type === 1" id="content_video" width="100%" height="100%" autoplay loop>
          <source :src="require(`@/assets/${next_video_uri}`)" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      </div>
    </transition>
  </div>
</template>

<script>
import IPC from "@/utils/ipc";

export default {
  name: "Content",
  props: {
    index: Number
  },
  data() {
    return {
      ipc: null,
      img_uri: 'logo.png',
      video_uri: '',
      next_img_uri: '',
      next_video_uri: '',
      isShowNext: false,
      last_res_url: null,
      file_type: 0
    }
  },
  created() {
    let _this = this;
    this.ipc = new IPC();
    this.ipc.onShowContent((screens) => {
      for (let i = 0; i < screens.length; i++) {
        let s = screens[i]
        if (s.index === _this.index + 1) {
          // 匹配到屏幕，获取文件uri
          this.file_type = s.file_type
          let file_uri = s.item_uri.replace('/static/', '')
          console.log(`匹配到屏幕: ${_this.index + 1}`)
          // 把uri赋值给组件
          if (this.last_res_url !== file_uri) {
            let needNext = !this.isShowNext
            this.showContent(s.file_type, file_uri, needNext)
            this.isShowNext = needNext
            this.last_res_url = file_uri
          }
        }
      }
    })
  },
  methods: {
    showContent(fileType, uri, isNext=false) {
      switch (fileType) {
        case 0:
          // 图片
          if (!isNext) {
            this.img_uri = uri
          } else {
            this.next_img_uri = uri
          }
          break;
        case 1: {
          // 视频
          if (!isNext) {
            this.video_uri = uri
          } else {
            this.next_video_uri = uri
          }
          let video = document.getElementById("content_video");
          // console.log("play mp4: " + this.content_url)
          let source = document.createElement('source');
          video.pause();
          let v = require(`@/assets/${uri}`)
          // let v = "file:///assets/ubtech_3.mov"
          source.setAttribute('src', v);
          source.setAttribute('type', 'video/mp4');
          video.load();
          video.play();
          break;
        }
      }
    }
  }
}
</script>

<style scoped>

</style>