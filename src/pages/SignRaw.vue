<template>
  <div>
    <div class="hx-main-container hx-sign-raw-container">
      <div class="-sign-raw-title">{{$t('signRawPage.title')}}</div>
      <div v-if="!signRawDone">
        <el-form
          :model="signRawForm"
          status-icon
          ref="signRawForm"
          label-width="90pt"
          class="hx-sign-raw-inner-container"
        >
          <div>
            <el-input
              class="-input-address"
              v-bind:placeholder="$t('signRawPage.please_input_content')"
              type="text"
              v-model="signRawForm.content"
              style="width: 100pt;"
            ></el-input>
          </div>
          <div style="margin-top: 30pt;">
            <AddressOrSelectWalletInput
              :currentAddress="currentAccount && currentAccount.address"
              @change-current-account="onChangeSelectedAccount"
            ></AddressOrSelectWalletInput>
          </div>
          <div style="margin-top: 30pt;">
            <el-button
              type="primary"
              class="hxwallet-form-btn"
              v-on:click="toSignRaw(signRawForm.content)"
            >{{$t('signRawPage.sign_now')}}</el-button>
          </div>
        </el-form>
      </div>
      <div v-if="signRawDone" class="hx-sign-raw-done-container">
        <div class="-sign-raw-title">Signature:</div>
        <div v-if="signRawForm.signedSignatureHex">
          <p class="-signed-text">{{signRawForm.signedSignatureHex}}</p>
        </div>
        <div v-if="!signRawForm.signedSignatureHex">Sign failed</div>
      </div>
    </div>
  </div>
</template>

<script>
import _ from "lodash";
import appState from "../appState";
import AccountInfo from "./AccountInfo.vue";
import ContractInfoPanel from "../components/ContractInfoPanel.vue";
import TransactionInfo from "../components/TransactionInfo.vue";
import AddressOrSelectWalletInput from "../components/AddressOrSelectWalletInput.vue";
import utils from "../utils";
let { PrivateKey, key, TransactionBuilder, TransactionHelper } = hx_js;

export default {
  name: "CheckTx",
  components: {
    AccountInfo,
    ContractInfoPanel,
    TransactionInfo,
    AddressOrSelectWalletInput
  },
  data() {
    return {
      signRawForm: {},

      signRawDone: false,
      data: null,
      signedSignatureHex: null,
      currentAccountInfo: {},
      currentAccount: null,
      closeTimeoutMilli: 5000
    };
  },
  created() {
    const account = appState.getCurrentAccount();
    this.currentAccount = account;
    if (account) {
      this.currentAddress = account.address;
      this.loadCurrentAccountInfo();
    }
  },
  mounted() {
    const flashTxMessage = appState.getFlashTxOnce();
    if (flashTxMessage) {
      this.onFlashTxMessage(flashTxMessage);
    }
    appState.onPushFlashTxMessage(this.onFlashTxMessage);

    if (this.signRawForm.content) {
      this.toSignRaw(this.signRawForm.content);
    }
  },
  beforeDestroy() {
    appState.offPushFlashTxMessage(this.onFlashTxMessage);
    this.destroyed = true;
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  },
  methods: {
    onFlashTxMessage(msg) {
      const rawData = msg;
      const content = rawData.rawData;
      this.signRawForm.content = content;
      console.log("to sign text", content);
      this.$forceUpdate();
    },
    showError(e) {
      e = utils.getShowErrorMessage(e);
      this.$message({
        showClose: true,
        message: e,
        type: "error"
      });
    },
    showSuccess(info) {
      this.$message({
        showClose: true,
        message: (info || "success").toString(),
        type: "success"
      });
    },
    toSignRaw(content) {
      if (!this.currentAccount) {
        this.showError("Please open wallet first");
        return;
      }
      if (!content || content.length < 1) {
        this.showError("Can't sign empty text");
        return;
      }
      // only sign content with verified format, starts with '{' or '['
      if (content[0] !== "{" && content[0] !== "[") {
        this.showError("Content to sign must start with { or [");
        return;
      }

      const contentHex = TransactionHelper.bytes_to_hex(content);
      const pkey = PrivateKey.fromBuffer(this.currentAccount.getPrivateKey());
      const pubKey = pkey.toPublicKey();

      const rawSig = TransactionHelper.signHex(contentHex, pkey, pubKey);
      const rawSigHex = rawSig.toHex();
      console.log("rawSig", rawSigHex);
      this.signRawForm.signedSignatureHex = rawSigHex;
      this.signRawDone = true;

      //   appState.bindPayId(rawSigHex);
      if (typeof messageToBackground !== "undefined") {
        messageToBackground("sig", rawSigHex);
        if (utils.isChromeExtension()) {
          this.closeTimer = setTimeout(() => {
            if (!this.destroyed) {
              window.close();
            }
            this.closeTimer = null;
          }, this.closeTimeoutMilli);
        }
      }
    },
    loadCurrentAccountInfo() {
      if (!this.currentAccount) {
        return;
      }
      const nodeClient = appState.getNodeClient();
      appState
        .withSystemAssets()
        .then(() => {
          return nodeClient
            .getAccountByAddresss(this.currentAddress)
            .then(accountInfo => {
              if (accountInfo) {
                this.currentAccountInfo = accountInfo;
              } else {
                this.currentAccountInfo = {};
              }
            });
        })
        .catch(this.showError.bind(this));
    },
    onChangeSelectedAccount(account) {
      this.currentAccount = account;
      this.currentAddress = account.address;
      this.loadCurrentAccountInfo();
    }
  }
};
</script>

<style lang="scss">
.hx-sign-raw-container1 {
  .label-font {
    color: #a99eb4;
    font-size: 8pt;
  }
}
.hx-sign-raw-container2 {
  .label-font {
    color: #a99eb4;
    font-size: 8pt;
  }
}
.hx-sign-raw-container,
.hx-sign-raw-done-container {
  min-width: 400px;
  min-height: 266pt;
  .-sign-raw-title {
    font-size: 20pt;
    color: #261932;
    margin-bottom: 40pt;
  }
  .-address-rule-desc {
    font-size: 8pt;
    color: #cccccc;
    margin-top: 10pt;
    margin-left: 50pt;
    text-align: left;
    p {
      padding: 0;
      margin: 4px;
      line-height: 18px;
      height: 18px;
    }
  }
  label {
    font-size: 10pt;
    color: #261932;
  }
  .el-input {
    width: 220pt !important;
  }
  .el-input__inner {
    border: 0 !important;
    border-bottom: solid 1px #cccccc !important;
    border-radius: 0 !important;
  }
  .-signed-text {
    color: #a99eb4;
    font-size: 10pt;
    padding: 5pt;
    word-break: break-all;
  }
}

.chrome-ext-app-container {
  .hx-sign-raw-container {
    padding-left: 0;
    padding-right: 0;
  }
}
</style>
