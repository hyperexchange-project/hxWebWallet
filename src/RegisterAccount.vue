<template>
  <div>
    <div v-if="!registerDone" class="hx-main-container hx-register-account-container">
      <div class="-register-account-title">注册账户</div>
      <el-form
        :model="registerAccountForm"
        status-icon
        ref="registerAccountForm"
        label-width="100pt"
        class="hx-register-account-inner-container"
      >
        <el-form-item label="账户名称" prop="name">
          <el-input
            class="-input-account-name"
            placeholder="请输入账户名称"
            type="text"
            v-model="registerAccountForm.name"
            autocomplete="off"
            style="width: 100pt;"
          ></el-input>
          <div class="-account-name-rule-desc">
            <p>1. 2-63位字符</p>
            <p>2. 仅可输入小写字母或数字或-</p>
            <p>3. 需小写字母开头</p>
          </div>
        </el-form-item>
        <el-form-item label="手续费" prop="feeAmount">
          <div style="text-align: left; padding-left: 50pt;">5HX</div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="-register-account-btn" v-on:click="registerAccount">立即注册</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div v-if="registerDone" class="hx-main-container hx-register-account-done-container">
      <div class="-register-account-title" style="color: #261932;">注册请求已发出，请等5秒后刷新界面</div>
      <div>
        <div style="color: #261932;font-size: 10pt; padding-top: 35pt;">您的账户名</div>
        <div
          style="color: #261932; font-size: 15pt; padding-top: 15pt;"
        >{{registerAccountForm.name}}</div>
      </div>
      <div style="margin-top: 40pt;">
        <el-button type="primary" class="hxwallet-form-btn" v-on:click="backToWallet">返 回</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import _ from "lodash";
import appState from "./appState";
let { PrivateKey, key, TransactionBuilder, TransactionHelper } = hx_js;

export default {
  name: "RegisterAccount",
  data() {
    return {
      currentAddress: "",
      currentAccount: "",

      currentAccountBalances: [],
      currentAccountInfo: {},

      registerAccountForm: {},

      registerDone: false
    };
  },
  created() {
    let account = appState.getCurrentAccount();
    this.currentAccount = account;
    this.currentAddress = account.address;
  },
  mounted() {
    appState.onChangeCurrentAccount(this.onChangeCurrentAccount);
  },
  beforeDestroy() {
    appState.offChangeCurrentAccount(this.onChangeCurrentAccount);
  },
  methods: {
    onChangeCurrentAccount(account) {
      this.currentAccount = account;
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
    },
    showSuccess(info) {
      this.$message({
        showClose: true,
        message: (info || "success").toString(),
        type: "success"
      });
    },
    registerAccount() {
      let name = (this.registerAccountForm.name || "").trim();
      if (
        name.length < 2 ||
        name.length > 63 ||
        !/^[a-zA-Z][a-zA-Z\d\-]*$/.test(name)
      ) {
        this.showError("账户名格式错误");
        return;
      }
      const apisInstance = appState.getApisInstance();
      const pkey = PrivateKey.fromBuffer(this.currentAccount.getPrivateKey());
      const pubKey = pkey.toPublicKey();
      appState
        .withApis()
        .then(() => {
          return TransactionHelper.getAccount(apisInstance, name)
            .then(r => {
              throw new Error("此账户名已被注册");
            })
            .catch(() => {
              // account not registered
              return true;
            });
        })
        .then(() => {
          let op = TransactionHelper.new_register_account_operation(
            this.currentAccount.address,
            pubKey,
            name
          );
          let tr = new TransactionBuilder();
          tr.add_type_operation("account_create", op);
          tr.set_expire_seconds(0);
          return tr.set_required_fees().then(() => {
            return tr.finalize().then(() => tr);
          });
        })
        .then(tr => {
          tr.add_signer(pkey, pubKey);
          tr.sign();
          tr.broadcast(function() {})
            .then(() => {
              this.registerDone = true;
            })
            .catch(e => {
              this.showError(
                "注册失败，可能余额不足够支付注册手续费，或者账户名已被注册"
              );
            });
        })
        .catch(this.showError);
    },
    backToWallet() {
      appState.changeCurrentTab("my_wallet");
    }
  }
};
</script>

<style lang="scss">
.hx-register-account-container1 {
  .label-font {
    color: #a99eb4;
    font-size: 8pt;
  }
}
.hx-register-account-container2 {
  .label-font {
    color: #a99eb4;
    font-size: 8pt;
  }
}
.hx-register-account-container,
.hx-register-account-done-container {
  min-width: 400px;
  min-height: 266pt;
  .-register-account-title {
    font-size: 20pt;
    color: #261932;
  }
  .-account-name-rule-desc {
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
}
.hx-register-account-inner-container {
  width: 400pt;
  margin: 20pt auto 0 auto;
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

  .-register-account-btn {
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
