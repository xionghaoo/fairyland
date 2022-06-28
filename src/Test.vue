<template>
  <video id="test_video" width="100%" height="100%" autoplay loop>
    <source :src="video_url" type="video/mp4">
    Your browser does not support the video tag.
  </video>
</template>

<script>
import IPC from './utils/ipc'


export default {
  name: "Test",
  data() {
    return {
      file_uri: "assets/mov_bbb.mp4",
      video_url: null
    }
  },
  created() {
    let ipc = new IPC()
    let path = ipc.getAppPath();
    console.log(path)
    let filePath = `file:///${path}/${this.file_uri}`
    console.log(filePath)
    this.video_url = filePath
  },
  methods: {
  }
}
</script>

<style scoped>

</style>