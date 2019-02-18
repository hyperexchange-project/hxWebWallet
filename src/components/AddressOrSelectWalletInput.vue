<template>
  <div class="hx-address-or-select-wallet-input">
    <div v-if="currentAddress && walletUnlocked">
      <el-form-item
        v-bind:label="$t('keystoreInput.from_address')"
        ng-if="false"
        prop="currentAddress"
        style="text-align: left;"
      >
        <span class="label-font -address-show-label">{{currentAddress}}</span>
        <span
          class="-change-wallet-btn"
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
import appState from "../appState";
import utils from "../utils";
import FileInput from "./FileInput.vue";
import KeystoreInput from "./KeystoreInput.vue";

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
        this.showError(this.$t("keystoreInput.please_open_locked_file"));
        return;
      }
      this.unlockWalletForm.password = this.unlockWalletForm.password.trim();
      if (
        this.unlockWalletForm.password.length < 8 ||
        this.unlockWalletForm.password.length > 30
      ) {
        this.showError(this.$t("keystoreInput.wallet_password_length_invalid"));
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
        this.showSuccess(this.$t("dialogs.unlock_successfully"));
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
  .-address-show-label {
    padding-left: 50pt;
    float: left;
  }
  .-change-wallet-btn {
    color: #a64eb5;
    float: left;
    padding-left: 10pt;
  }
}
@media (max-width: 600px) {
  .hx-address-or-select-wallet-input {
    max-width: 400px;
  }
}
</style>
