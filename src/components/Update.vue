<template>
  <div class="page">
    <el-progress :percentage="50"></el-progress>
  </div>
</template>

<script>

export default {
  name: "Update"
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