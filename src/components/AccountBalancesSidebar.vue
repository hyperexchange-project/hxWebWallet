<template>
  <div class="hx-account-balances-side-bar">
    <el-row style="margin-bottom: 20pt;">
      <el-col :span="8">
        <div class="grid-content -balance-title-panel">
          <div class="label-font">{{$t('accountBalances.wallet_balance')}}</div>
        </div>
      </el-col>
      <el-col :span="16">
        <div class="grid-content -switch-panel">
          <el-switch v-model="hideZeroAssets"></el-switch>
          <span class="label-font">{{$t('accountBalances.hide_zero_balances')}}</span>
        </div>
      </el-col>
    </el-row>
    <div class="-account-balances-panel">
      <div
        v-for="balance in filterBalances(accountBalances, hideZeroAssets, showAccountBalancesLimit)"
        class="-account-balance"
        :key="balance.assetSymbol"
      >
        <div class="-asset-symbol-label">{{balance.assetSymbol}}</div>
        <div class="-asset-amount-label">{{balance.amountNu.toFixed(balance.precision)}}</div>
      </div>
      <div
        v-if="showAccountBalancesLimit && filterBalances(accountBalances, hideZeroAssets, null).length>showAccountBalancesLimit"
      >
        <i class="el-icon-arrow-down" v-on:click="showAllBalances" style="cursor: pointer;"></i>
      </div>
      <div class="clearfix"></div>
    </div>
  </div>
</template>

<script>
import _ from "lodash";
import { format, distanceInWordsToNow } from "date-fns";
import appState from "../appState";
import utils from "../utils";
let { PrivateKey, key, TransactionBuilder, TransactionHelper } = hx_js;
window.datefns = require("date-fns");

export default {
  name: "AccountBalancesSidebar",
  props: ["accountBalances", "defaultLimit"],
  components: {},
  data() {
    return {
      hideZeroAssets: true,
      showAccountBalancesLimit: null
    };
  },
  created() {
    this.showAccountBalancesLimit = this.defaultLimit;
  },
  watch: {},
  mounted() {},
  beforeDestroy() {},
  methods: {
    filterBalances(balances, skipZero = false, limit = null) {
      let filtered = balances;
      if (skipZero) {
        filtered = balances.filter(item => item.amount > 0);
      }
      if (limit) {
        filtered = filtered.slice(0, limit);
      }
      if(filtered.length === 0) {
          filtered = [utils.emptyHxBalance];
      }
      return filtered;
    },
    showAllBalances() {
      this.showAccountBalancesLimit = null;
    }
  }
};
</script>

<style lang="scss">
.hx-account-balances-side-bar {
  .-account-balances-panel {
    position: relative;
  }
  .-account-balance {
    display: block;
    float: left;
    width: 55pt;
    padding-bottom: 15px;
    text-align: center;
  }
  .-asset-symbol-label {
    color: #a99eb4;
    font-size: 7pt;
  }
  .-asset-amount-label {
    color: #261932;
    font-size: 8pt;
    padding-top: 4pt;
  }
  .-balance-title-panel {
    text-align: left;
  }
  .-switch-panel {
    text-align: right;
  }
}
</style>
