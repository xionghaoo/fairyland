<template>
  <div>
    <img :src="require(`@/assets/${content_uri}`)" width="100%" height="100%">
  </div>
</template>

<script>
import IPC from "@/utils/ipc";
// import img_url from "@/assets/huawei/huawei1.jpg"


export default {
  name: "Content",
  props: {
    index: Number
  },
  data() {
    return {
      ipc: null,
      content_uri: ''
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
          this.content_uri = s.item_uri.replace('/static/', '')
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