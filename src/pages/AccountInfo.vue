<template>
  <div>
    <div>
      <div class="hx-panel hx-account-info-panel">
        <el-row class="-address-row">
          <el-col :span="4">
            <div class="grid-content label-font" v-if="myself">{{$t('accountInfoPage.my_address')}}</div>
            <div class="grid-content label-font" v-if="!myself">{{$t('accountInfoPage.account_address')}}</div>
          </el-col>
          <el-col :span="8">
            <div class="grid-content label-font">
              <div>{{accountAddress}}</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="grid-content label-font">{{$t('accountInfoPage.account_name')}}</div>
          </el-col>
          <el-col :span="8">
            <div class="grid-content label-font" style="text-align: left;">
              <div v-if="infoAccountInfo.name">{{infoAccountInfo.name}}</div>
              <div
                v-if="!infoAccountInfo.name"
                class="-not-registered-account-btn"
                v-on:click="toRegisterAccount()"
              >{{$t('accountInfoPage.not_registered')}}</div>
              <span
                style="color: #A64EB5; float: right; margin-top: -18px; margin-right: 30px;"
                v-if="myself"
                v-on:click="opened=false"
              >{{$t('keystoreInput.change_wallet')}}</span>
            </div>
          </el-col>
        </el-row>
        <AccountBalancesSidebar
            style="margin-top: 20px;"
          :accountBalances="infoAccountBalances"
          :defaultLimit="showAccountBalancesLimit"
        ></AccountBalancesSidebar>
        
      </div>
      <AccountLockBalancesPanel v-if="infoAccountInfo && infoAccountInfo.name" :currentAccount="myself?infoAccount:null" :accountName="infoAccountInfo.name" :myself="myself"></AccountLockBalancesPanel>
    </div>
  </div>
</template>

<script>
import _ from "lodash";
import appState from "../appState";
import utils from "../utils";
import KeystoreInput from "../components/KeystoreInput.vue";
import AccountBalancesSidebar from "../components/AccountBalancesSidebar.vue";
import AccountLockBalancesPanel from "../components/AccountLockBalancesPanel.vue";
let { PrivateKey, key, TransactionBuilder, TransactionHelper } = hx_js;

export default {
  name: "AccountInfo",
  props: ["accountAddress", "myself"],
  components: { KeystoreInput, AccountBalancesSidebar, AccountLockBalancesPanel },
  data() {
    return {
      infoAccount: "",
      hideZeroAssets: false,
      showAccountBalancesLimit: 5,

      infoAccountBalances: [
        utils.emptyHxBalance
      ],
      infoAccountInfo: {},

      unlockWalletForm: {
        keystoreFile: null,
        keystoreFileInput: null,
        keystoreFileJson: null,
        password: ""
      }
    };
  },
  created() {},
  watch: {
    accountAddress(newVal, oldVal) {
      this.loadInfoAccountInfo();
    }
  },
  mounted() {
    this.loadInfoAccountInfo();
  },
  beforeDestroy() {},
  methods: {
    showError(e) {
      if (e && e.message) {
        e = e.message;
      }
      e = (e || "error").toString();
      this.$message({
        showClose: true,
        message: e,
        type: "error"
      });
    },
    showInfo(info) {
      this.$message({
        showClose: true,
        message: (info || "info").toString()
      });
    },
    showSuccess(info) {
      this.$message({
        showClose: true,
        message: (info || "success").toString(),
        type: "success"
      });
    },
    showWarning(info) {
      this.$message({
        showClose: true,
        message: (info || "warning").toString(),
        type: "warning"
      });
    },
    showAllBalances() {
      this.showAccountBalancesLimit = null;
    },
    loadInfoAccountInfo() {
      if (!this.accountAddress) {
        return;
      }
      const nodeClient = appState.getNodeClient();
      appState
        .withSystemAssets()
        .then(assets => {
          return nodeClient.getAddrBalances(
            this.accountAddress
          ).then(balances => {
            this.infoAccountBalances.length = 0;
            for (let asset of assets) {
              let balance = balances.filter(b => b.asset_id === asset.id)[0];
              let item = {
                assetId: asset.id,
                assetSymbol: asset.symbol,
                amount: balance ? balance.amount : 0,
                precision: asset.precision,
                amountNu: balance
                  ? new BigNumber(balance.amount).div(
                      Math.pow(10, asset.precision)
                    )
                  : new BigNumber(0)
              };
              this.infoAccountBalances.push(item);
            }
            return balances;
          });
        })
        .then(() => {
          return nodeClient.getAccountByAddresss(
            this.accountAddress
          ).then(accountInfo => {
            if (accountInfo) {
              this.infoAccountInfo = accountInfo;
            } else {
              this.infoAccountInfo = {};
            }
          });
        })
        .catch(this.showError.bind(this));
    },
    filterBalances(balances, skipZero = false, limit = null) {
      let filtered = balances;
      if (skipZero) {
        filtered = balances.filter(item => item.amount > 0);
      }
      if (limit) {
        filtered = filtered.slice(0, limit);
      }
      return filtered;
    },
    toRegisterAccount() {
      if (!this.myself) {
        return;
      }
      appState.changeCurrentTab("register_account");
    },
    onSelectKeystoreFile(fileJson, filename) {
      this.unlockWalletForm.keystoreFileJson = fileJson;
      this.unlockWalletForm.keystoreFile = filename;
    },
    toUnlockKeystoreFile() {
      if (!this.unlockWalletForm.keystoreFileJson) {
        this.showError("请打开待解锁文件");
        return;
      }
      this.unlockWalletForm.password = this.unlockWalletForm.password.trim();
      if (
        this.unlockWalletForm.password.length < 8 ||
        this.unlockWalletForm.password.length > 30
      ) {
        this.showError("密码需要8-30位长度");
        return;
      }
      let fileJson = this.unlockWalletForm.keystoreFileJson;
      let password = this.unlockWalletForm.password;
      try {
        let account = account_utils.NewAccount();
        account.fromKey(fileJson, password);
        let address = account.getAddressString("HX");
        account.address = address;
        appState.changeCurrentAccount(account);
        // save to storage
        try {
          if (typeof localStorage !== "undefined") {
            localStorage.setItem("keyInfo", JSON.stringify(fileJson));
            localStorage.setItem("keyPassword", password);
          }
        } catch (e) {
          console.log(e);
        }
        try {
          if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.set({ keyInfo: fileJson }, function() {
              console.log("Value is set to " + valueJson);
            });
            messageToBackground("newWallet", "true");
          }
        } catch (e) {
          console.log(e);
        }
        this.showSuccess("解锁成功");
      } catch (e) {
        this.showError(e);
      }
    }
  }
};
</script>

<style lang="scss">
.hx-account-info-panel {
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
  .-address-row {
    padding-bottom: 10px;
    border-bottom: solid 1px #f3f3f3;
  }
  .-balance-label-row {
    padding-top: 10px;
    padding-bottom: 20px;
  }
  .-account-balance {
    width: 20% !important;
  }
  .-not-registered-account-btn {
    color: #653699;
    font-size: 8pt;
    cursor: pointer;
  }
}

.hx-account-info-panel {
  min-width: 400pt;
  min-height: 266pt;
  margin: 0 auto;
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
  .-selectKeyStoreFile {
    cursor: pointer;
  }
  .-unlock-keystore-file-btn {
    width: 150pt;
    height: 30pt;
    color: white;
    font-size: 10pt;
    background: linear-gradient(#a64eb5, #7951b3);
    border: 0;
    border-radius: 0;
    margin-left: -80pt;
  }
  .hx-account-balances-side-bar {
      .-balance-title-panel {
          text-align: left;
          padding-left: 50pt;
      }
      .-switch-panel {
          text-align: right;
          padding-right: 50pt;
      }
  }
}
</style>
