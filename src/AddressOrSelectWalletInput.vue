<template>
  <div class="hx-address-or-select-wallet-input">
    <div v-if="currentAddress && walletUnlocked">
      <el-form-item v-bind:label="$t('keystoreInput.from_address')" ng-if="false" prop="currentAddress" style="text-align: left;">
        <span class="label-font -address-show-label" style="padding-left: 50pt; float: left;">{{currentAddress}}</span>
        <span class="-change-wallet-btn"
          style="color: #A64EB5; float: left; padding-left: 10pt;"
          v-on:click="walletUnlocked=false"
        >{{$t('keystoreInput.change_wallet')}}</span>
      </el-form-item>
      <div class="clearfix"></div>
    </div>
    <div v-if="!currentAddress || !walletUnlocked">
      <el-form-item v-bind:label="$t('keystoreInput.select_wallet')" prop="keystoreFile">
        <KeystoreInput @select-file="onSelectKeystoreFile" :filename="filename"></KeystoreInput>
      </el-form-item>
      <el-form-item v-bind:label="$t('keystoreInput.wallet_password')" prop="password">
        <el-input
          v-bind:placeholder="$t('keystoreInput.please_input_wallet_password')"
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
        >{{$t('keystoreInput.unlock_now')}}</el-button>
      </el-form-item>
    </div>
  </div>
</template>

<script>
import FileInput from "./FileInput.vue";
import KeystoreInput from "./KeystoreInput.vue";
import appState from "./appState";
import utils from "./utils";

export default {
  name: "AddressOrSelectWalletInput",
  components: { FileInput, KeystoreInput },
  data() {
    return {
      walletUnlocked: false,
      filename: null,
      unlockWalletForm: {}
    };
  },
  created() {
    if (this.currentAddress) {
      this.walletUnlocked = true;
    }
  },
  methods: {
    onSelectKeystoreFile(keyJson, filename) {
      this.unlockWalletForm.keystoreFileJson = keyJson;
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
        this.walletUnlocked = true;
        this.$emit("change-current-account", account);
      } catch (e) {
        this.showError(e);
      }
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
    }
  },
  props: ["currentAddress"]
};
</script>

<style lang="scss">
.hx-address-or-select-wallet-input {
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
