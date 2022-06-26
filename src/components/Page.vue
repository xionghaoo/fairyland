<template>
  <div>
    <h1>this page is {{index}}</h1>
    <br>
    <button v-on:click="checkUpdate">更新检查</button>
  </div>
</template>

<script>
import IPC from "@/utils/ipc";

export default {
  name: "Page",
  props: {
    index: Number
  },
  created() {

  },
  methods: {
    checkUpdate() {
      let ipc = new IPC()
      ipc.downloadResource()
      ipc.onDownloadProgress((progress) => {
        console.log('download progress: ' + progress)
      })
    }
  }
}
</script>

<style scoped>

</style>