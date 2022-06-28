<template>
  <div class="page">
    <div class="center">
      <h3 style="display: block; padding-left: 20px">正在更新资源。。。</h3>
      <el-progress style="margin-top: 10px" type="circle" :percentage="progressValue"/>
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