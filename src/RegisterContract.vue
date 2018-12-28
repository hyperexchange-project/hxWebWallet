<template>
  <div>
    <div class="hx-panel hx-register-contract-container">
      <div class="-left-side" v-if="step==='transfer'">
        <el-form
          :model="contractForm"
          status-icon
          ref="contractForm"
          label-width="90pt"
          class="hx-register-contract-inner-container"
        >
          <el-form-item v-bind:label="$t('contractPage.select_contract_file')" prop="keystoreFile">
            <div>
              <FileInput
                @select-file="onSelectContractFile"
                :filename="contractForm.contractFilename"
                :fileFormat="'binary'"
                :accept="'.gpc'"
                :placeholder="$t('contractPage.please_select_contract_gpc_file')"
              ></FileInput>
            </div>
          </el-form-item>
          <AddressOrSelectWalletInput
            :currentAddress="currentAccount && currentAccount.address"
            @change-current-account="onChangeSelectedAccount"
          ></AddressOrSelectWalletInput>

          <el-form-item v-bind:label="$t('contractPage.balance')" prop="amount">
            <el-input
              class="-input-amount"
              placeholder
              type="text"
              :readonly="true"
              v-model="currentAccountHxBalance"
              style
            >
              <template slot="append">HX</template>
            </el-input>
          </el-form-item>
          <el-form-item label="Gas Limit" prop="gasLimit">
            <el-input
              class="-input-gas-limit"
              placeholder
              type="text"
              v-model="contractForm.gasLimit"
              style="width: 100pt;"
            ></el-input>
          </el-form-item>
          <el-form-item label="Gas Price" prop="gasPrice">
            <el-input
              class="-input-gas-price"
              placeholder
              type="text"
              v-model="contractForm.gasPrice"
              style
            >
              <template slot="append">HX</template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              class="hxwallet-form-btn"
              @click="emulateDeployContract"
              style="margin-left: -80pt;"
            >{{$t('contractPage.test')}}</el-button>
            <el-button
              type="primary"
              class="hxwallet-form-btn"
              @click="toSubmitDeployContract"
              style="margin-left: 0;"
            >{{$t('contractPage.submit')}}</el-button>
          </el-form-item>
        </el-form>
        <el-dialog
          v-bind:title="$t('dialogs.please_confirm_tx_info')"
          :visible.sync="showConfirmDialog"
          width="300pt"
          height="187pt"
          class="-register-contract-confirm-dialog"
          :show-close="true"
          :before-close="closeConfirmDialog"
          center
        >
          <div>
            <el-row style="margin-bottom: 15pt;">
              <el-col :span="6">
                <div class="grid-content label-font">Gas Limit</div>
              </el-col>
              <el-col :span="18">
                <div class="grid-content label-font value-label">{{contractForm.gasLimit}}</div>
              </el-col>
            </el-row>
            <el-row style="margin-bottom: 15pt;">
              <el-col :span="6">
                <div class="grid-content label-font">Gas Price</div>
              </el-col>
              <el-col :span="18">
                <div class="grid-content label-font value-label">{{contractForm.gasPrice}}</div>
              </el-col>
            </el-row>
            <el-row style="margin-bottom: 15pt;">
              <el-col :span="6">
                <div class="grid-content label-font">{{$t('contractPage.fee')}}</div>
              </el-col>
              <el-col :span="18">
                <div
                  class="grid-content label-font value-label"
                >{{hxAmountToString(contractForm.fee && contractForm.fee.amount)}} HX</div>
              </el-col>
            </el-row>
          </div>
          <span slot="footer" class="dialog-footer">
            <el-button
              class="hxwallet-form-btn"
              type="primary"
              @click="doSubmitDeployContract"
            >{{$t('contractPage.confirmWithSpace')}}</el-button>
          </span>
        </el-dialog>
      </div>

      <!-- contract_sent panel -->
      <div class="-left-side" v-if="step==='contract_sent'">
        <div
          style="color: #261932; font-size: 12pt; margin-top: 30pt;"
        >{{$t('transferPage.tx_making')}}</div>
        <div style="margin-top: 10pt; font-size: 35pt; color: #653699;">
          <i class="el-icon-loading"></i>
        </div>
        <div style="margin-top: 10pt; font-size: 10pt; color: #261932;">
          <p style="height: auto;">{{$('transferPage.tx_making_and_will_refresh_after_done')}}</p>
          <p>{{$t('transferPage.you_can_also_query_tx_by_tx_hash')}}</p>
        </div>
        <div>
          <el-button
            type="text"
            style="color: #653699; font-size: 10pt;"
            @click="toViewTx(lastSentTxId)"
          >{{lastSentTxId}}</el-button>
        </div>
        <div style="margin-top: 15pt;">
          <el-button class="hxwallet-form-btn" @click="backToTransfer">{{$t('contractPage.return')}}</el-button>
        </div>
      </div>

      <!-- contract_fail panel -->
      <div class="-left-side" v-if="step==='contract_fail'">
        <div
          style="color: #261932; font-size: 12pt; margin-top: 30pt;"
        >{{$t('transferPage.tx_failed')}}</div>
        <div style="margin-top: 10pt; font-size: 35pt; color: #FF0000;">
          <i class="el-icon-error"></i>
        </div>
        <div style="margin-top: 10pt; font-size: 10pt; color: red;">
          <p
            style="overflow: hidden; text-overflow: ellipsis; margin: 0 auto; max-width: 80%; max-height: 131pt;"
          >{{transferFailError}}</p>
        </div>
        <div style="margin-top: 20pt;">
          <el-button
            type="text"
            style="color: #653699; font-size: 10pt;"
            @click="toViewTx(lastSentTxId)"
          >{{lastSentTxId}}</el-button>
        </div>
        <div style="margin-top: 15pt;">
          <el-button class="hxwallet-form-btn" @click="backToTransfer">{{$t('contractPage.return')}}</el-button>
        </div>
      </div>

      <!-- contract_success panel -->
      <div class="-left-side" v-if="step==='contract_success'">
        <div
          style="color: #261932; font-size: 12pt; margin-top: 30pt;"
        >{{$t('transferPage.tx_success')}}</div>
        <div style="margin-top: 10pt; font-size: 35pt; color: #00DD00;">
          <i class="el-icon-success"></i>
        </div>
        <div style="margin-top: 10pt; font-size: 10pt; color: #261932;">
          <p>{{$t('transferPage.tx_on_chain_success')}}</p>
          <p>{{$t('transferPage.you_can_query_tx_status_on_chain')}}</p>
        </div>
        <div>
          <el-button
            type="text"
            style="color: #653699; font-size: 10pt;"
            @click="toViewTx(lastSentTxId)"
          >{{lastSentTxId}}</el-button>
        </div>
        <div style="margin-top: 15pt;">
          <el-button class="hxwallet-form-btn" @click="backToTransfer">{{$t('contractPage.return')}}</el-button>
        </div>
      </div>
      <div class="clearfix"></div>
    </div>
  </div>
</template>

<script>
import _ from "lodash";
import appState from "./appState";
import utils from "./utils";
import KeystoreInput from "./KeystoreInput.vue";
import FileInput from "./FileInput.vue";
import SideNavbar from "./SideNavbar.vue";
import AddressOrSelectWalletInput from "./AddressOrSelectWalletInput.vue";
let { PrivateKey, key, TransactionBuilder, TransactionHelper } = hx_js;

export default {
  name: "RegisterContract",
  components: {
    KeystoreInput,
    FileInput,
    SideNavbar,
    AddressOrSelectWalletInput
  },
  data() {
    return {
      lastSentTxId: null,
      transferFailError: null,
      showConfirmDialog: false,
      step: "transfer", // transfer, contract_sent, contract_success, contract_fail
      walletUnlocked: false,
      hideZeroAssets: true,
      contractForm: {
        contractFilename: "",
        filename: appState.getCurrentAddress(),
        transferAssetId: "1.3.0",
        gasLimit: 10000,
        gasPrice: "0.00001",
        contractGpcHex: null
      },
      currentAccountBalances: [],
      currentAccountHxBalance: 0,
      currentAccountInfo: {}
    };
  },
  created() {
    let account = appState.getCurrentAccount();
    this.currentAccount = account;
    if (account) {
      this.walletUnlocked = true;
      this.currentAddress = account.address;
      this.loadCurrentAccountInfo();
    } else {
      this.walletUnlocked = false;
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
    onSelectNavbarItem(item) {
      this.selectedNavbarItem = item.key;
    },
    onSelectContractFile(fileBytes, filename) {
      this.contractForm.contractFilename = filename;
      let gpcHex = utils.bytesToHex(fileBytes);
      this.contractForm.contractGpcHex = gpcHex;
    },
    onChangeSelectedAccount(account) {
      this.currentAccount = account;
      this.currentAddress = account.address;
      this.loadCurrentAccountInfo();
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
              if (asset.id === "1.3.0") {
                this.currentAccountHxBalance = item.amountNu.toFixed(
                  asset.precision
                );
              }
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
    backToTransfer() {
      this.contractForm = {
        filename: appState.getCurrentAddress(),
        transferAssetId: "1.3.0"
      };
      this.step = "transfer";
    },
    toViewTx(txId) {
      appState.changeCurrentTab("check_tx", [txId]);
    },
    closeConfirmDialog() {
      this.showConfirmDialog = false;
    },
    emulateDeployContract() {
      this.emulateState = null;
      if (!this.currentAccount) {
        this.showError(
          this.$t("contractPage.please_open_and_unlock_your_wallet_first")
        );
        return;
      }
      const gpcHex = this.contractForm.contractGpcHex;
      if (!gpcHex) {
        this.showError(
          this.$t("contractPage.please_select_contract_file_first")
        );
        return;
      }
      const pkey = PrivateKey.fromBuffer(this.currentAccount.getPrivateKey());
      const pubkey = pkey.toPublicKey();
      const apisInstance = appState.getApisInstance();
      appState
        .withApis()
        .then(() => {
          TransactionHelper.registerContractTesting(
            apisInstance,
            pubkey,
            gpcHex
          )
            .then(data => {
              console.log(data);
              const fee = data[0];
              const gasCount = data[1];
              this.contractForm.gasLimit = parseInt(gasCount * 1.1);
              this.contractForm.fee = fee;
              this.emulateState = "success";
              this.showSuccess("Emulate successfully");
            })
            .catch(e => {
              this.emulateState = "error";
              this.showError(e);
            });
        })
        .catch(this.showError);
    },
    toSubmitDeployContract() {
      this.showConfirmDialog = true;
    },
    doSubmitDeployContract() {
      this.showConfirmDialog = false;
      if (this.emulateState !== "success") {
        this.showError("请先测试执行");
        return;
      }
      if (!this.currentAccount) {
        this.showError("请先打开并解锁钱包");
        return;
      }
      const gpcHex = this.contractForm.contractGpcHex;
      if (!gpcHex) {
        this.showError("请先打开合约文件");
        return;
      }
      const gasLimit = parseInt(this.contractForm.gasLimit);
      const gasPriceNu = new BigNumber(this.contractForm.gasPrice);
      if (gasPriceNu.isNaN()) {
        this.showError("不正确的gas price格式");
        return;
      }
      const gasPrice = parseInt(
        gasPriceNu.multipliedBy(Math.pow(10, appState.hxPrecision)).toFixed(0)
      );
      if (!gasLimit || gasLimit <= 0) {
        this.showError("不正确的gas limit格式");
        return;
      }
      if (gasLimit > 1000000) {
        this.showError("过大的gas limit");
        return;
      }
      if (!gasPrice || gasPrice <= 0) {
        this.showError("不正确的gas price格式");
        return;
      }
      const pkey = PrivateKey.fromBuffer(this.currentAccount.getPrivateKey());
      const pubkey = pkey.toPublicKey();
      const callerAddress = this.currentAccount.address;
      const apisInstance = appState.getApisInstance();
      appState
        .withApis()
        .then(() => {
          let tr = new TransactionBuilder();
          let op = TransactionHelper.new_contract_register_operation_from_gpc(
            callerAddress,
            pubkey,
            gasLimit,
            gasPrice,
            gpcHex
          );
          tr.add_type_operation("contract_register", op);
          tr.set_expire_seconds(0);
          return tr.set_required_fees().then(() => {
            return tr.finalize().then(() => tr);
          });
        })
        .then(tr => {
          tr.add_signer(pkey, pubkey);
          tr.sign();
          let txid = tr
            .sha256(tr.tr_buffer)
            .toString("hex")
            .substr(0, 40);
          this.lastSentTxId = txid;
          tr.broadcast(function() {})
            .then(() => {
              setTimeout(() => {
                this.getTransaction(txid)
                  .then(tx => {
                    console.log("tx: ", tx);
                    this.step = "contract_success";
                    this.loadCurrentAccountInfo();
                  })
                  .catch(e => {
                    this.step = "contract_fail";
                    this.transferFailError = "交易尚未上链，请稍后查询此交易ID";
                  });
              }, 6000);
            })
            .catch(e => {
              this.step = "contract_fail";
              this.transferFailError = e.toString();
            });
          this.step = "contract_sent";
        })
        .catch(this.showError);
    },
    getTransaction(txid) {
      const apisInstance = appState.getApisInstance();
      return appState.withApis().then(() => {
        return TransactionHelper.getTransactionById(apisInstance, txid);
      });
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
    hxAmountToString(val) {
      return utils.hxAmountToString(val);
    }
  }
};
</script>

<style lang="scss">
.hx-register-contract-container {
  min-width: 400px;
  min-height: 381pt;
  background: inherit;
  padding-top: 0;
  width: calc(100% - 117pt);
  padding: 0;
  float: right;
  .-nav-side {
    margin-top: 4pt;
  }
  .label-font {
    color: #a99eb4;
    font-size: 8pt;
  }
  .-nav-side {
    width: 110pt;
    float: left;
    margin-right: 6pt;
  }
  .-left-side {
    width: 100%;
    background: white;
    min-height: 381pt;
    padding: 0 20pt;
  }
  .-right-side {
    width: calc(30% - 10pt);
    min-width: 250px;
    float: right;
    text-align: left;
    background: white;
    min-height: 381pt;
    margin-left: 10pt;
    padding: 20pt;
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
  .-address-row {
    padding-bottom: 10px;
    border-bottom: solid 1px #f3f3f3;
  }
  .-balance-label-row {
    padding-top: 10px;
    padding-bottom: 20px;
  }
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
  .transfer-asset-select {
    .el-input {
      width: 40pt !important;
      font-size: 8pt;
      margin-left: 10pt;
      input {
        font-size: 8pt;
        padding: 0;
        text-indent: 5pt;
      }
      .el-input__suffix {
        font-size: 8pt;
        width: 15pt;
      }
    }
  }
  .el-form-item__label {
    color: #a99eb4;
    font-size: 8pt;
  }
  .value-label {
    color: #261932;
    font-size: 8pt;
  }
  .-register-contract-confirm-dialog {
    .grid-content {
      text-align: center;
    }
  }
  .hx-address-or-select-wallet-input {
    .-address-show-label {
      padding-left: 120pt !important;
    }
  }
}

@media (max-width: 960px) {
  .hx-register-contract-container {
    .-right-side {
      display: none;
    }
    .-left-side {
      width: 100%;
    }
  }
}

.hx-register-contract-inner-container,
.hx-register-contract-done-inner-container {
  min-width: 400pt;
  margin: 20pt auto 0 auto;
  padding-left: 20pt;
  label {
    font-size: 10pt;
    color: #261932;
  }
  .el-form-item__label {
    text-align: left;
  }
  .el-input {
    width: 220pt !important;
  }
  .el-input-group--append {
    width: 220pt !important;
  }
  .el-input-group__append {
    border-top: 0;
    border-right: 0;
    border-radius: 0;
    background: white;
    border-bottom: solid 1px #cccccc !important;
  }
  .el-input__inner {
    border: 0 !important;
    border-bottom: solid 1px #cccccc !important;
    border-radius: 0 !important;
  }
  .-transfer-title {
    font-size: 20pt;
    color: #261932;
  }
  .-wallet-password-rule-desc,
  .-rule-panel {
    font-size: 8pt;
    color: #ff0000;
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
</style>
