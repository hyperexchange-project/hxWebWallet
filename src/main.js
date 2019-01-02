import Vue from 'vue'
import ElementUI from 'element-ui';

window.Vue = Vue;
Vue.use(ElementUI)

import VueI18n from "vue-i18n";
import messages from "./translations";
import appState from "./appState";

const i18n = new VueI18n({
  locale: appState.getCurrentLanguage(),
  fallbackLocale: 'english',
  messages, // set locale messages
});

Vue.use(VueI18n);

// appState.onChangeCurrentLanguage((lang) => {
//   console.log("changed lang to ", lang);
//   i18n.locale = lang;
// });

window.hxAppState = appState;

import App from './App.vue'
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-vue/dist/bootstrap-vue.css"


const app = new Vue({
  i18n,
  el: '#app',
  render: h => h(App)
})
