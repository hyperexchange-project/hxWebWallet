<template>
  <div>
    <!-- when need to unlock account -->
    <div v-if="!opened">
      <div class="hx-main-container hx-my-wallet-container">
        <el-form
          :model="unlockWalletForm"
          status-icon
          ref="unlockWalletForm"
          label-width="100pt"
          class="hx-my-wallet-inner-container"
        >
          <el-form-item v-bind:label="$t('myWalletPage.select_wallet')" prop="keystoreFile">
            <KeystoreInput
              @select-file="onSelectKeystoreFile"
              :filename="unlockWalletForm.keystoreFile"
            ></KeystoreInput>
          </el-form-item>
          <el-form-item v-bind:label="$t('myWalletPage.please_input_wallet_password')" prop="password">
            <el-input
              v-bind:placeholder="$t('myWalletPage.please_input_wallet_password')"
              type="password"
              v-model="unlockWalletForm.password"
              style="width: 100pt;"
            ></el-input>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              class="-unlock-keystore-file-btn"
              v-on:click="toUnlockKeystoreFile"
            >{{$t('myWalletPage.unlock_right_now')}}</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- TODO: use AccountInfo component -->
    <!-- when account opened -->
    <div v-if="opened">
      <div class="hx-main-container hx-my-opened-wallet-container1">
        <el-row class="-address-row">
          <el-col :span="4">
            <div class="grid-content label-font">{{$t('myWalletPage.my_address')}}</div>
          </el-col>
          <el-col :span="8">
            <div class="grid-content label-font">
              <div>{{currentAddress}}</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="grid-content label-font">{{$t('myWalletPage.account_name')}}</div>
          </el-col>
          <el-col :span="8">
            <div class="grid-content label-font" style="text-align: left;">
              <div v-if="currentAccountInfo.name">{{currentAccountInfo.name}}</div>
              <div
                v-if="!currentAccountInfo.name"
                class="-not-registered-account-btn"
                v-on:click="toRegisterAccount()"
              >{{$t('myWalletPage.not_registered')}}</div>
              <!-- TODO: how to change wallet -->
              <span
                style="color: #A64EB5; float: right; margin-top: -18px; margin-right: 30px;"
                v-on:click="opened=false"
              >{{$t('myWalletPage.change_wallet')}}</span>
            </div>
          </el-col>
        </el-row>
        <AccountBalancesSidebar
          style="margin-top: 20px;"
          :accountBalances="currentAccountBalances"
          :defaultLimit="showAccountBalancesLimit"
        ></AccountBalancesSidebar>
      </div>
      <div class="hx-main-container hx-my-opened-wallet-container2" style="display: none;">TODO</div>
    </div>
  </div>
</template>

<script>
import _ from "lodash";
import appState from "./appState";
import KeystoreInput from "./KeystoreInput.vue";
import AccountBalancesSidebar from "./AccountBalancesSidebar.vue";
let { PrivateKey, key, TransactionBuilder, TransactionHelper } = hx_js;

export default {
  name: "HxMyWallet",
  components: { KeystoreInput, AccountBalancesSidebar },
  data() {
    return {
      opened: false,
      currentAddress: "",
      currentAccount: "",
      hideZeroAssets: false,
      showAccountBalancesLimit: 5,

      currentAccountBalances: [
        {
          assetId: "1.3.0",
          assetSymbol: "HX",
          amountNu: new BigNumber(0),
          amount: 0
        }
      ],
      currentAccountInfo: {},

      unlockWalletForm: {
        keystoreFile: null,
        keystoreFileInput: null,
        keystoreFileJson: null,
        password: ""
      }
    };
  },
  created() {
    let account = appState.getCurrentAccount();
    this.currentAccount = account;
    if (account) {
      this.opened = true;
      this.currentAddress = account.address;
      this.loadCurrentAccountInfo();
    } else {
      this.opened = false;
    }
  },
  mounted() {
    appState.onChangeCurrentAccount(this.onChangeCurrentAccount);
  },
  beforeDestroy() {
    appState.offChangeCurrentAccount(this.onChangeCurrentAccount);
  },
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
    loadCurrentAccountInfo() {
      if (!this.currentAccount) {
        return;
      }
      const apisInstance = appState.getApisInstance();
      appState
        .withSystemAssets()
        .then(assets => {
          return TransactionHelper.getAddrBalances(
            apisInstance,
            this.currentAccount.address
          ).then(balances => {
            this.currentAccountBalances.length = 0;
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
              this.currentAccountBalances.push(item);
            }
            return balances;
          });
        })
        .then(() => {
          return TransactionHelper.getAccountByAddresss(
            apisInstance,
            this.currentAddress
          ).then(accountInfo => {
            if (accountInfo) {
              this.currentAccountInfo = accountInfo;
            } else {
              this.currentAccountInfo = {};
            }
          });
        })
        .catch(this.showError.bind(this));
    },
    onChangeCurrentAccount(account) {
      this.currentAccount = account;
      this.currentAddress = account.address;
    },
    updateCurrentAccountBalances(balances) {
      this.currentAccountBalances = balances;
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
        this.opened = true;
      } catch (e) {
        this.showError(e);
      }
    }
  }
};
</script>

<style lang="scss">
.hx-my-opened-wallet-container1 {
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
.hx-my-opened-wallet-container2 {
  .label-font {
    color: #a99eb4;
    font-size: 8pt;
  }
}
.hx-my-wallet-container {
  min-width: 400px;
  min-height: 266pt;
}
.hx-my-wallet-inner-container {
  width: 400pt;
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
}
</style>
