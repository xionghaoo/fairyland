<template>
  <div>
    <div v-if="file_type === 0">
      <transition name="el-fade-in-linear">
        <div v-show="!isShowNext">
          <img :src="img_uri" width="100%" height="100%">
        </div>
      </transition>
      <transition name="el-fade-in-linear">
        <div v-show="isShowNext">
          <img :src="next_img_uri" width="100%" height="100%">
        </div>
      </transition>
    </div>
    <video v-else-if="file_type === 1" id="content_video" width="100%" height="100%" autoplay loop>
      <source :src="video_uri" type="video/mp4">
      Your browser does not support the video tag.
    </video>
  </div>
</template>

<script>
import IPC from "@/utils/ipc";
import img1 from "@/assets/cover_left_top.png"
import img2 from "@/assets/cover_right_top.png"
import img3 from "@/assets/cover_left_bottom.png"
import img4 from "@/assets/cover_right_bottom.png"
import Constant from "@/utils/constant";

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
      file_prefix: '',
      file_type: 0,
    }
  },
  created() {
    let _this = this;
    this.showDefaultContent()
    this.ipc = new IPC();
    let path = this.ipc.getAppPath();
    this.file_prefix = `file:///${path}/assets`
    this.ipc.onShowContent((screens) => {
      if (screens.length > 0) {
        for (let i = 0; i < screens.length; i++) {
          let s = screens[i]
          if (s.index === _this.index + 1) {
            // 匹配到屏幕，获取文件uri
            this.file_type = s.file_type
            let file_uri = s.item_uri.replace(Constant.RESOURCE_PREFIX, '')
            console.log("文件 uri: " + file_uri)
            // 把uri赋值给组件
            if (this.last_res_url !== file_uri) {
              let needNext = !this.isShowNext
              this.showContent(s.file_type, file_uri, needNext)
              this.isShowNext = needNext
              console.log("给文件uri赋值: " + file_uri)
              this.last_res_url = file_uri
            }
          }
        }
      } else {
        if (this.last_res_url != null) {
          console.log("显示默认内容")
          this.file_type = 0
          _this.showDefaultContent();
          this.isShowNext = !this.isShowNext
          this.last_res_url = null
        }
      }
    })
  },
  methods: {
    showDefaultContent() {
      switch (this.$props.index) {
        case 0:
          this.img_uri = img1;
          this.next_img_uri = img1;
          break;
        case 1:
          this.img_uri = img2;
          this.next_img_uri = img2;
          break;
        case 2:
          this.img_uri = img3;
          this.next_img_uri = img3;
          break;
        case 3:
          this.img_uri = img4;
          this.next_img_uri = img4;
          break;
      }
    },
    showContent(fileType, uri, isNext=false) {
      switch (fileType) {
        case 0:
          // 图片
          if (!isNext) {
            this.img_uri = `${this.file_prefix}/${uri}`
          } else {
            this.next_img_uri = `${this.file_prefix}/${uri}`
          }
          break;
        case 1: {
          // 视频
          this.video_uri = `${this.file_prefix}/${uri}`
          let video = document.getElementById("content_video");
          let source = document.createElement('source');
          if (video) {
            video.pause();
            // let v = `${this.file_prefix}/${uri}`
            source.setAttribute('src', this.video_uri);
            source.setAttribute('type', 'video/mp4');
            video.load();
            video.play();
          }
          break;
        }
      }
    }
  }
}
</script>

<style scoped>

</style>