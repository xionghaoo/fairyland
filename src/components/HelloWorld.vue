<template>
  <div class="hello">
    <h1>{{ window.currentIndex }}</h1><br>
    <button v-on="startScan">扫描Ble蓝牙</button>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  data() {
    return {
      window: window
    }
  },
  methods: {
    startScan() {
      console.log("startScan");
      const ipc = this.window.require('electron').ipcRenderer
      ipc.send('startScan');
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
