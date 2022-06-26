import Vue from 'vue'
import App from './App.vue'
import ElementUI from 'element-ui';
import VueResource from 'vue-resource';
import 'element-ui/lib/theme-chalk/index.css';
import router from './routers';

Vue.config.productionTip = false
Vue.use(ElementUI);
Vue.use(VueResource);

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
