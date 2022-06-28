<template>
  <div class="page">
    <el-progress class="progress" type="circle" :percentage="progressValue"></el-progress>
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
.progress {
  display: flex;
}
</style>