<template>
  <div class="app-container">
    <el-dialog
        :visible.sync="isShow"
        :show-close="false"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        title="下载进度"
        width="30%"
    >
      <div style="text-align:center">
        <el-progress type="circle" :percentage="progress"></el-progress>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import IPC from "@/utils/ipc";

export default {
  name: 'Updater',
  data () {
    return {
      isShow: false,
      progress: 0
    }
  },
  mounted () {
    let _this = this;
    this.ipc = new IPC();

    this.ipc.onUpdaterDownloadStart(() => {
      _this.isShow = true
    })
    this.ipc.onUpdaterDownloadProgress((obj) => {
      _this.progress = obj.percent.toFixed(0)
    })
    this.ipc.onUpdaterDownloadCompleted(() => {
      _this.isShow = false
      console.log('更新包下载完成')
    })
  }
}
</script>