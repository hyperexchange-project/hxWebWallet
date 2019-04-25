<template>
  <div class="toolbar-wrapper">
    <el-row style="max-width: 1000px; margin: 0 auto;">
      <el-col v-for="tab in tabs" :key="tab.key" :span="tab.span">
        <div class="hx-toolbar-item" v-on:click="changeToolbarTab(tab.key)" v-bind:class="{selected: selectedTab===tab.key}">
            {{$t(tab.label)}}
            <div class="hx-toolbar-item-border" :style="{background: 'images/toolbar-border.png'}"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import EventEmitter from "eventemitter3";
import appState from "../appState.js";

export default {
  name: "HxToolbar",
  data() {
    return {
        selectedTab: appState.getCurrentTab(),
        tabs: [
            {label: 'toolbar.my_wallet', key: 'my_wallet', span: 4},
            {label: 'toolbar.create_wallet', key: 'create_wallet', span: 4},
            {label: 'toolbar.transfer', key: 'transfer', span: 4},
            {label: 'toolbar.contract', key: 'contract', span: 4},
            {label: 'toolbar.check_tx', key: 'check_tx', span: 4},
            {label: 'toolbar.sign_raw', key: 'sign_raw', span: 4},
        ]
    };
  },
  methods: {
      changeToolbarTab(tabKey) {
          this.selectedTab = tabKey;
          appState.changeCurrentTab(this.selectedTab);
      }
  }
};
</script>

<style lang="scss" scoped>
.toolbar-wrapper {
    height: 29pt;
    line-height: 27pt;
    font-size: 8pt;
    background: white;
    .hx-toolbar-item {
        margin: 0 auto;
    }
    .hx-toolbar-item:hover {
        cursor: pointer;
        background: #ecf6ff;
    }
    .hx-toolbar-item.selected {
        .hx-toolbar-item-border {
            width: 20pt;
            height: 2pt;
            background-repeat: no-repeat;
            margin: 0 auto;
        }
    }
}
</style>
