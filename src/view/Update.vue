<template>
  <div class="page">
    <div class="center">
      <h3 style="display: block">发现新的资源包</h3>
      <el-progress style="margin-top: 10px" type="circle" :percentage="progressValue"/>
      <p>{{ progressValue >= 75 ? '解压中。。。' : '正在下载。。。'}}</p>
    </div>
  </div>
</template>

<script>
import { Progress } from 'element-ui'

export default {
  name: "Update",
  props: {
    'value': Number
  },
  components: {
    'el-progress': Progress
  },
  computed: {
    progressValue() {
      return this.$props.value
    }
  }
}
</script>

<style scoped>
.page {
  width: 100%;
  height: 100%;
  display: flex;
  justify-items: center;
  align-items: center;
}
.center {
  display: flex;
  align-items: center;
  flex-direction: column;
  margin: auto;
}
</style>