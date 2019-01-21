<template>
  <div>
    <el-row class="-info-line-row">
      <el-col :span="8">
        <div class="grid-content label-font">Contract Address</div>
      </el-col>
      <el-col :span="16">
        <div class="grid-content label-font">
          <div>{{operation.contract_id}}</div>
        </div>
      </el-col>
    </el-row>
    <el-row class="-info-line-row">
      <el-col :span="8">
        <div class="grid-content label-font">Caller Address</div>
      </el-col>
      <el-col :span="16">
        <div class="grid-content label-font">
          <div>{{operation.caller_addr}}</div>
        </div>
      </el-col>
    </el-row>
    <el-row class="-info-line-row">
      <el-col :span="8">
        <div class="grid-content label-font">Gas Limit</div>
      </el-col>
      <el-col :span="16">
        <div class="grid-content label-font">
          <div>{{operation.invoke_cost}}</div>
        </div>
      </el-col>
    </el-row>
    <el-row class="-info-line-row">
      <el-col :span="8">
        <div class="grid-content label-font">Gas Price</div>
      </el-col>
      <el-col :span="16">
        <div class="grid-content label-font">
          <div>{{hxAmountToString(operation.gas_price)}}</div>
        </div>
      </el-col>
    </el-row>
    <el-row class="-info-line-row">
      <el-col :span="8">
        <div class="grid-content label-font">Actual Tx Fee</div>
      </el-col>
      <el-col :span="16">
        <div class="grid-content label-font">
          <div>{{opTotalFee(operation.fee.amount, operation.invoke_cost, operation.gas_price)}} HX</div>
        </div>
      </el-col>
    </el-row>
    <el-row class="-info-line-row">
      <el-col :span="8">
        <div class="grid-content label-font">API</div>
      </el-col>
      <el-col :span="16">
        <div class="grid-content label-font">
          <div>{{operation.contract_api}}</div>
        </div>
      </el-col>
    </el-row>
    <el-row class="-info-line-row">
      <el-col :span="8">
        <div class="grid-content label-font">Invoke Param</div>
      </el-col>
      <el-col :span="16">
        <div class="grid-content label-font" style="overflow: hidden; text-overflow: ellipsis;">
          <div>{{operation.contract_arg}}</div>
        </div>
      </el-col>
    </el-row>
    <TxReceiptPanel v-if="txReceipt && txReceipt.events" :txReceipt="txReceipt"></TxReceiptPanel>
  </div>
</template>

<script>
import _ from "lodash";
import { format, distanceInWordsToNow } from "date-fns";
import appState from "../appState";
import utils from "../utils";
import TxReceiptPanel from "./TxReceiptPanel.vue";
let { PrivateKey, key, TransactionBuilder, TransactionHelper } = hx_js;
window.datefns = require("date-fns");

export default {
  name: "InvokeContractOpDetail",
  props: ["operation", "txReceipt"],
  components: {TxReceiptPanel},
  data() {
    return {};
  },
  created() {},
  watch: {},
  mounted() {},
  beforeDestroy() {},
  methods: {
    hxAmountToString(val) {
      return utils.hxAmountToString(val);
    },
    opTotalFee(opFeeAmount, gasCount, gasPrice) {
      return utils.opTotalFee(opFeeAmount, gasCount, gasPrice);
    },
    assetAmountToString(assetAmount) {
      return utils.assetAmountToString(assetAmount);
    },
    getOperationTypeName(opType) {
      return utils.getOperationTypeName(opType);
    }
  }
};
</script>

<style lang="scss">
.hx-tx-details-panel {
  .label-font {
    color: #a99eb4;
    font-size: 8pt;
  }
  .-asset-symbol-label {
    color: #a99eb4;
    font-size: 7pt;
  }
  .-asset-amount-label {
    color: #261932;
    font-size: 12pt;
    padding-top: 4pt;
  }
  .-info-line-row {
    padding-bottom: 10px;
    padding-top: 10px;
    border-bottom: solid 1px #f3f3f3;
    text-align: left;
  }
}
</style>
