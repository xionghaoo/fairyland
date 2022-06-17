<template>
  <div>
    <h1>this page is {{index}}</h1>
  </div>
</template>

<script>
export default {
  name: "Page",
  props: {
    index: Number
  }
}
</script>

<style scoped>

</style>