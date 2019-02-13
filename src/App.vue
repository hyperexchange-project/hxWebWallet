<template>
  <div id="app">
    <PageHeader></PageHeader>
    <HxToolbar></HxToolbar>
    <div>
      <HxMyWallet v-if="currentTabKey==='my_wallet'"></HxMyWallet>
      <CreateWallet v-if="currentTabKey==='create_wallet'"></CreateWallet>
      <RegisterAccount v-if="currentTabKey==='register_account'"></RegisterAccount>
      <Transfer v-if="currentTabKey==='transfer'"></Transfer>
      <CheckTx v-if="currentTabKey==='check_tx'"></CheckTx>
      <Contract v-if="currentTabKey==='contract'"></Contract>
    </div>
    <div class="hx-footer-bar">
      <div>@Copyright HyperExchange</div>
    </div>
  </div>
</template>

<script>
import PageHeader from "./components/Header.vue";
import HxToolbar from "./components/Toolbar.vue";
import HxMyWallet from "./pages/MyWallet.vue";
import RegisterAccount from "./pages/RegisterAccount.vue";
import CreateWallet from "./pages/CreateWallet.vue";
import Transfer from "./pages/Transfer.vue";
import CheckTx from "./pages/CheckTx.vue";
import Contract from "./pages/Contract.vue";
import appState from "./appState.js";

export default {
  name: "app",
  components: {
    PageHeader,
    HxToolbar,
    HxMyWallet,
    CreateWallet,
    RegisterAccount,
    Transfer,
    CheckTx,
    Contract
  },
  created() {
    const lastUsedNetwork = appState.getLastUsedNetwork();
    appState.changeCurrentNetwork(lastUsedNetwork ? lastUsedNetwork.key : "mainnet");
    this.currentTabKey = appState.getCurrentTab();
  },
  mounted() {
    appState.onChangeCurrentTab(this.onChangeCurrentTab);
  },
  beforeDestroy() {
    appState.offChangeCurrentTab(this.onChangeCurrentTab);
  },
  data() {
    return {
      currentTabKey: appState.getCurrentTab()
    };
  },
  methods: {
    onChangeCurrentTab(tabKey) {
      this.currentTabKey = tabKey;
    }
  }
};
</script>

<style lang="scss">
body::-webkit-scrollbar {
  display: none;
}

.hx-main-container {
  max-width: 1000px;
  margin: 0 auto;
  margin-top: 8px;
  background: white;
  padding: 50px 20px;
}

.hx-panel {
  min-width: 400px;
  max-width: 1000px;
  margin: 0 auto;
  margin-top: 8px;
  background: white;
  padding: 50px 20px;
}

#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  min-width: 400px;
  min-height: 500px;
}

.hx-footer-bar {
  position: fixed;
  bottom: 5pt;
  min-width: 200pt;
  text-align: center;
  color: #999999;
  font-size: 10pt;
  right: 40pt;
}

h1,
h2 {
  font-weight: normal;
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

.hxwallet-form-cancel-btn {
  width: 150pt;
  height: 30pt;
  // color: white;
  font-size: 10pt;
  // background: linear-gradient(#a64eb5, #7951b3);
  border: 0;
  border-radius: 0;
}
.hxwallet-form-btn {
  width: 150pt;
  height: 30pt;
  color: white;
  font-size: 10pt;
  background: linear-gradient(#a64eb5, #7951b3);
  border: 0;
  border-radius: 0;
}
.el-switch__core {
  width: 20px !important;
}
.el-switch .el-switch__core {
  border-color: #653699;
}
.el-switch.is-checked .el-switch__core {
  background-color: white;
  border-color: #653699;
}
.el-switch.is-checked .el-switch__core:after {
  background-color: #653699;
}

.grid-content {
  word-break: break-all;
}

.chrome-ext-app-container {
  .hx-main-container {
    width: 500px;
  }
}
</style>
