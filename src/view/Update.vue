<template>
  <div class="page">
    <el-progress :percentage="progress"></el-progress>
  </div>
</template>

<script>

export default {
  name: "Update",
  props: {
    'value': Number
  },
  computed: {
    progress() {
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
</style>