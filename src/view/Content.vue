<template>
  <div>
    <img v-if="file_type === 0" :src="require(`@/assets/${img_uri}`)" width="100%" height="100%">
    <video v-else-if="file_type === 1" id="content_video" width="100%" height="100%" autoplay loop>
      <source :src="require(`@/assets/${video_uri}`)" type="video/mp4">
<!--      <source src="file:///assets/ubtech_3.mov" type="video/mp4">-->
      Your browser does not support the video tag.
    </video>
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
      file_type: 0
    }
  },
  created() {
    let _this = this;
    this.ipc = new IPC();
    this.ipc.onShowContent((screens) => {
      for (let i = 0; i < screens.length; i++) {
        let s = screens[i]
        // 屏幕匹配
        if (s.index === _this.index + 1) {
          console.log(`匹配到屏幕: ${_this.index + 1}`)
          this.file_type = s.file_type
          let file_uri = s.item_uri.replace('/static/', '')
          switch (s.file_type) {
            case 0:
              // 图片
              this.img_uri = file_uri
              break;
            case 1: {
              // 视频
              this.video_uri = file_uri
              let video = document.getElementById("content_video");
              // console.log("play mp4: " + this.content_url)
              let source = document.createElement('source');
              video.pause();
              let v = require(`@/assets/${file_uri}`)
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
    })
  },
  methods: {

  }
}
</script>

<style scoped>

</style>