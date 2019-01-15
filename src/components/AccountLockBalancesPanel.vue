<template>
  <div class="hx-account-lock-balances-panel">
    <div v-show="step==='list'">
      <div class="hx-panel" style="padding-top: 10px;">
        <div class="-panel-title">{{$t('account_lock_balances.pledge_information')}}</div>
        <div v-if="myself" class="-top-control-panel">
          <el-button
            type="primary"
            @click="toMortgageToCitizen(null, '1.3.0')"
            class="-ctrl-btn hxwallet-form-btn"
          >{{$t('account_lock_balances.append')}}</el-button>
          <!-- TODO: 赎回全部按钮 -->
        </div>
        <div>
          <el-row style="margin-bottom: 20pt;" class="-table-header-row">
            <el-col :span="5">
              <div class="grid-content">
                <div class="label-font">{{$t('account_lock_balances.pledge_citizen')}}</div>
              </div>
            </el-col>
            <el-col :span="5">
              <div class="grid-content">
                <div class="label-font">{{$t('account_lock_balances.pledge_currency')}}</div>
              </div>
            </el-col>
            <el-col :span="5">
              <div class="grid-content">
                <div class="label-font">{{$t('account_lock_balances.pledge_amount')}}</div>
              </div>
            </el-col>
            <el-col :span="9">
              <div class="grid-content">
                <div class="label-font" v-if="myself">{{$t('account_lock_balances.operations')}}</div>
              </div>
            </el-col>
          </el-row>
          <el-row class="-table-body-row" v-for="balance in accountLockBalances" :key="balance.id">
            <el-col :span="5">
              <div class="grid-content">
                <div
                  class="label-font"
                >{{citizenById(balance.lockto_miner_account, balance.lockto_miner_account).name}}</div>
              </div>
            </el-col>
            <el-col :span="5">
              <div class="grid-content">
                <div class="label-font">{{assetById(balance.lock_asset_id).symbol}}</div>
              </div>
            </el-col>
            <el-col :span="5">
              <div class="grid-content">
                <div class="label-font">{{balance.lock_asset_amount_str.toString()}}</div>
              </div>
            </el-col>
            <el-col :span="9">
              <div class="grid-content">
                <div class="label-font" v-if="myself">
                  <el-button
                    type="primary"
                    @click="toMortgageToCitizen(balance.lockto_miner_account, balance.lock_asset_id)"
                    class="-ctrl-btn hxwallet-form-btn"
                  >{{$t('account_lock_balances.append')}}</el-button>
                  <el-button
                    type="primary"
                    @click="toCancelLockBalance(balance.lockto_miner_account, balance.lock_asset_id)"
                    class="-ctrl-btn hxwallet-form-btn"
                  >{{$t('account_lock_balances.redeem')}}</el-button>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
      <!-- 质押收益和领取收益 -->
      <div class="hx-panel" style="padding-top: 10px;">
        <div class="-panel-title">{{$t('account_lock_balances.pledge_income')}}</div>
        <div v-if="myself" class="-top-control-panel">
          <el-button
            type="primary"
            @click="receivePayBack(accountPayBacks)"
            class="-ctrl-btn hxwallet-form-btn"
          >{{$t('account_lock_balances.receive_all')}}</el-button>
        </div>
        <div>
          <el-row style="margin-bottom: 20pt;" class="-table-header-row">
            <el-col :span="5">
              <div class="grid-content">
                <div class="label-font">{{$t('account_lock_balances.pledge_citizen')}}</div>
              </div>
            </el-col>
            <el-col :span="5">
              <div class="grid-content">
                <div class="label-font">{{$t('account_lock_balances.currency')}}</div>
              </div>
            </el-col>
            <el-col :span="5">
              <div class="grid-content">
                <div class="label-font">{{$t('account_lock_balances.income')}}</div>
              </div>
            </el-col>
            <el-col :span="9">
              <div class="grid-content">
                <div class="label-font" v-if="myself">{{$t('account_lock_balances.operations')}}</div>
              </div>
            </el-col>
          </el-row>
          <el-row
            class="-table-body-row"
            v-for="payBack in accountPayBacks"
            :key="payBack.citizenName"
          >
            <el-col :span="5">
              <div class="grid-content">
                <div class="label-font">{{payBack.citizenName}}</div>
              </div>
            </el-col>
            <el-col :span="5">
              <div class="grid-content">
                <div class="label-font">{{payBack.asset.symbol}}</div>
              </div>
            </el-col>
            <el-col :span="5">
              <div class="grid-content">
                <div class="label-font">{{payBack.amountBnStr}}</div>
              </div>
            </el-col>
            <el-col :span="9">
              <div class="grid-content">
                <div class="label-font" v-if="myself">
                  <el-button
                    type="primary"
                    @click="receivePayBack([payBack])"
                    class="-ctrl-btn hxwallet-form-btn"
                  >{{$t('account_lock_balances.receive')}}</el-button>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </div>
    <div v-show="step==='mortgage'">
      <div class="hx-panel" style="padding-top: 10px;">
        <div class="-panel-title">{{$t('account_lock_balances.pledge')}}</div>
        <div class="-simple-form-panel">
          <el-form label-width="90pt" :model="mortgageForm">
            <el-form-item
              v-bind:label="$t('account_lock_balances.pledge_citizen')"
              prop="citizenId"
            >
              <el-select
                class="-citizen-select"
                filterable
                v-model="mortgageForm.citizenId"
                v-bind:placeholder="$t('account_lock_balances.pledge_citizen')"
              >
                <el-option
                  v-for="citizenBase in systemCitizens"
                  :key="citizenBase[1]"
                  :label="citizenBase[0]"
                  :value="citizenBase[1]"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item v-bind:label="$t('account_lock_balances.pledge_currency')" prop="assetId">
              <el-input class="-input-amount" placeholder type="text" v-model="mortgageForm.amount"></el-input>
              <el-select
                class="-asset-select -transfer-asset-select"
                v-model="mortgageForm.assetId"
                v-bind:placeholder="$t('account_lock_balances.pledge_currency')"
              >
                <el-option
                  v-for="asset in systemAssets"
                  :key="asset.id"
                  :label="asset.symbol"
                  :value="asset.id"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item class="-control-panel">
              <el-button
                type="primary"
                class="hxwallet-form-btn"
                @click="mortageToCitizen"
                style="width: 100px;"
              >{{$t('account_lock_balances.pledge')}}</el-button>
              <el-button
                type="primary"
                class="hxwallet-form-btn"
                @click="backToList"
                style="width: 100px;"
              >{{$t('account_lock_balances.back')}}</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
    <div v-show="step==='redeem'">
      <div class="hx-panel" style="padding-top: 10px;">
        <div class="-panel-title">{{$t('account_lock_balances.redeem')}}</div>
        <div class="-simple-form-panel">
          <el-form label-width="90pt" :model="redeemForm">
            <el-form-item
              v-bind:label="$t('account_lock_balances.pledge_citizen')"
              prop="citizenId"
            >
              <el-select
                class="-citizen-select"
                filterable
                v-model="redeemForm.citizenId"
                v-bind:placeholder="$t('account_lock_balances.pledge_citizen')"
              >
                <el-option
                  v-for="citizenBase in systemCitizens"
                  :key="citizenBase[1]"
                  :label="citizenBase[0]"
                  :value="citizenBase[1]"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item v-bind:label="$t('account_lock_balances.pledge_currency')" prop="assetId">
              <el-input class="-input-amount" placeholder type="text" v-model="redeemForm.amount"></el-input>
              <el-select
                class="-asset-select -transfer-asset-select"
                v-model="redeemForm.assetId"
                v-bind:placeholder="$t('account_lock_balances.pledge_currency')"
              >
                <el-option
                  v-for="asset in systemAssets"
                  :key="asset.id"
                  :label="asset.symbol"
                  :value="asset.id"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item class="-control-panel">
              <el-button
                type="primary"
                class="hxwallet-form-btn"
                @click="redeemFromCitizen"
                style="width: 100px;"
              >{{$t('account_lock_balances.redeem')}}</el-button>
              <el-button
                type="primary"
                class="hxwallet-form-btn"
                @click="backToList"
                style="width: 100px;"
              >{{$t('account_lock_balances.back')}}</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
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
  name: "AccountLockBalancesPanel",
  props: ["accountName", "currentAccount", "myself"],
  components: {},
  data() {
    return {
      accountLockBalances: [],
      accountPayBacks: [],
      accountInfo: null,
      citizensAccountCache: {},
      systemAssets: [],
      systemCitizens: [],
      mortgageForm: {},
      redeemForm: {},
      step: "list" // list, mortgage, redeem
    };
  },
  created() {},
  watch: {
    accountName(newVal, oldVal) {
      this.loadLockBalances();
    }
  },
  mounted() {
    this.loadLockBalances();
  },
  beforeDestroy() {},
  methods: {
    citizenById(citizenId, defaultName) {
      return this.citizensAccountCache[citizenId] || { name: defaultName };
    },
    assetById(assetId) {
      for (const asset of this.systemAssets) {
        if (asset.id === assetId) {
          return asset;
        }
      }
      return {};
    },
    loadSystemCitizens() {
      const apisInstance = appState.getApisInstance();
      appState
        .withApis()
        .then(() => {
          return TransactionHelper.getCitizensCount(apisInstance);
        })
        .then(citizensCount => {
          return TransactionHelper.listCitizens(
            apisInstance,
            "",
            citizensCount
          );
        })
        .then(citizens => {
          this.systemCitizens = citizens;
        })
        .catch(this.showError);
    },
    toMortgageToCitizen(selectedCitizenId, assetId) {
      if (this.systemCitizens.length < 1) {
        this.loadSystemCitizens();
      }
      this.mortgageForm = {
        citizenId: selectedCitizenId,
        assetId: assetId
      };
      this.step = "mortgage";
    },
    receivePayBack(payBacks) {
      if (!this.currentAccount || !this.accountInfo) {
        this.showError("you can only control your own wallet");
        return;
      }
      if (!payBacks) {
        this.showError("Please select at least one pay back");
        return;
      }
      const pkey = PrivateKey.fromBuffer(this.currentAccount.getPrivateKey());
      const pubkey = pkey.toPublicKey();
      const callerAddress = this.currentAccount.address;
      const apisInstance = appState.getApisInstance();
      const takePayBackItems = [];
      for (const item of payBacks) {
        if (item.amount < 100) {
          continue;
        }
        takePayBackItems.push([
          item.citizenName,
          { amount: item.amount, asset_id: item.assetId }
        ]);
      }
      if (takePayBackItems.length < 1) {
        this.showError(
          "at least take pay back with amount >= " +
            new BigNumber(100)
              .div(Math.pow(10, appState.hxPrecision))
              .toFixed(appState.hxPrecision)
        );
        return;
      }

      appState
        .withApis()
        .then(() => {
          let tr = new TransactionBuilder();
          let op = TransactionHelper.new_take_payback_from_citizen_operation(
            callerAddress,
            takePayBackItems
          );
          tr.add_type_operation("pay_back", op);
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
          console.log("tx hash:", txid);
          this.showSuccess("Transaction sent, please wait for seconds");
          if (typeof messageToBackground !== "undefined") {
            messageToBackground("txhash", txid);
          }
          tr.broadcast(function() {})
            .then(() => {
              setTimeout(() => {
                this.getTransaction(txid)
                  .then(tx => {
                    console.log("tx: ", tx);
                    this.step = "list";
                    this.showSuccess("take paybacks successfully");
                    this.loadLockBalances();
                  })
                  .catch(e => {
                    console.log("take paybacks error", e);
                    this.showError("take paybacks failed");
                  });
              }, 6000);
            })
            .catch(e => {
              console.log("take paybacks error", e);
              this.showError("take paybacks failed");
            });
        })
        .catch(this.showError);
    },
    mortageToCitizen() {
      if (!this.currentAccount || !this.accountInfo) {
        this.showError("you can only control your own wallet");
        return;
      }
      const citizenId = this.mortgageForm.citizenId;
      const assetId = this.mortgageForm.assetId;
      const amount = this.mortgageForm.amount;
      const amountBn = new BigNumber(amount);
      if (!citizenId || !assetId) {
        this.showError("Invalid citizen or asset");
        return;
      }
      const asset = this.assetById(assetId);
      if (!asset || !asset.id) {
        this.showError("Can't find this asset");
        return;
      }
      if (!amountBn || amountBn.isNaN() || amountBn.lte(0)) {
        this.showError("Invalid amount format");
        return;
      }
      const amountFull = parseInt(
        amountBn.multipliedBy(Math.pow(10, asset.precision)).toFixed(0)
      );
      const pkey = PrivateKey.fromBuffer(this.currentAccount.getPrivateKey());
      const pubkey = pkey.toPublicKey();
      const callerAddress = this.currentAccount.address;
      const apisInstance = appState.getApisInstance();

      appState
        .withApis()
        .then(() => {
          let tr = new TransactionBuilder();
          let op = TransactionHelper.new_lockbalance_to_citizen_operation(
            callerAddress,
            this.accountInfo.id,
            citizenId,
            assetId,
            amountFull
          );
          tr.add_type_operation("lockbalance", op);
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
          console.log("tx hash:", txid);
          this.showSuccess("Transaction sent, please wait for seconds");
          if (typeof messageToBackground !== "undefined") {
            messageToBackground("txhash", txid);
          }
          tr.broadcast(function() {})
            .then(() => {
              setTimeout(() => {
                this.getTransaction(txid)
                  .then(tx => {
                    console.log("tx: ", tx);
                    this.step = "list";
                    this.showSuccess("Mortgage successfully");
                    this.loadLockBalances();
                  })
                  .catch(e => {
                    console.log("mortgage error", e);
                    this.showError("Mortgage failed");
                  });
              }, 6000);
            })
            .catch(e => {
              console.log("mortgage error", e);
              this.showError("Mortgage failed");
            });
        })
        .catch(this.showError);
    },
    redeemFromCitizen() {
      if (!this.currentAccount || !this.accountInfo) {
        this.showError("you can only control your own wallet");
        return;
      }
      const citizenId = this.redeemForm.citizenId;
      const assetId = this.redeemForm.assetId;
      const amount = this.redeemForm.amount;
      const amountBn = new BigNumber(amount);
      if (!citizenId || !assetId) {
        this.showError("Invalid citizen or asset");
        return;
      }
      const asset = this.assetById(assetId);
      if (!asset || !asset.id) {
        this.showError("Can't find this asset");
        return;
      }
      if (!amountBn || amountBn.isNaN() || amountBn.lte(0)) {
        this.showError("Invalid amount format");
        return;
      }
      const amountFull = parseInt(
        amountBn.multipliedBy(Math.pow(10, asset.precision)).toFixed(0)
      );
      const pkey = PrivateKey.fromBuffer(this.currentAccount.getPrivateKey());
      const pubkey = pkey.toPublicKey();
      const callerAddress = this.currentAccount.address;
      const apisInstance = appState.getApisInstance();

      appState
        .withApis()
        .then(() => {
          let tr = new TransactionBuilder();
          let op = TransactionHelper.new_forclose_balance_from_citizen_operation(
            callerAddress,
            this.accountInfo.id,
            citizenId,
            assetId,
            amountFull
          );
          tr.add_type_operation("foreclose_balance", op);
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
          console.log("tx hash:", txid);
          this.showSuccess("Transaction sent, please wait for seconds");
          if (typeof messageToBackground !== "undefined") {
            messageToBackground("txhash", txid);
          }
          tr.broadcast(function() {})
            .then(() => {
              setTimeout(() => {
                this.getTransaction(txid)
                  .then(tx => {
                    console.log("tx: ", tx);
                    this.step = "list";
                    this.showSuccess("Redeem successfully");
                    this.loadLockBalances();
                  })
                  .catch(e => {
                    console.log("redeem error", e);
                    this.showError("Redeem failed");
                  });
              }, 6000);
            })
            .catch(e => {
              console.log("redeem error", e);
              this.showError("Redeem failed");
            });
        })
        .catch(this.showError);
    },
    toCancelLockBalance(citizenId, assetId) {
      if (this.systemCitizens.length < 1) {
        this.loadSystemCitizens();
      }
      this.redeemForm = {
        citizenId: citizenId,
        assetId: assetId
      };
      this.step = "redeem";
    },
    getTransaction(txid) {
      const apisInstance = appState.getApisInstance();
      return appState.withApis().then(() => {
        return TransactionHelper.getTransactionById(apisInstance, txid);
      });
    },
    loadLockBalances() {
      if (!this.accountName) {
        return;
      }
      const apisInstance = appState.getApisInstance();
      appState
        .withSystemAssets()
        .then(assets => {
          this.systemAssets = assets;
          return TransactionHelper.getAccountByName(
            apisInstance,
            this.accountName
          ).then(account => {
            this.accountInfo = account;
            TransactionHelper.getAccountLockBalances(apisInstance, account.id)
              .then(balances => {
                this.accountLockBalances.length = 0;
                const usingCitizenIds = [];
                for (let item of balances) {
                  const asset = this.assetById(item.lock_asset_id);
                  if (!asset) {
                    continue;
                  }
                  item.lock_asset_amount_nu = new BigNumber(
                    item.lock_asset_amount
                  ).div(Math.pow(10, asset.precision));
                  item.lock_asset_amount_str = item.lock_asset_amount_nu.toFixed(
                    asset.precision
                  );
                  this.accountLockBalances.push(item);
                  if (usingCitizenIds.indexOf(item.lockto_miner_account) < 0) {
                    usingCitizenIds.push(item.lockto_miner_account);
                  }
                }
                return usingCitizenIds;
              })
              .then(usingCitizenIds => {
                for (const citizenId of usingCitizenIds) {
                  if (this.citizensAccountCache[citizenId]) {
                    continue;
                  }
                  TransactionHelper.getCitizen(apisInstance, citizenId)
                    .then(citizen => {
                      return TransactionHelper.getAccount(
                        apisInstance,
                        citizen.miner_account
                      );
                    })
                    .then(account => {
                      this.$set(this.citizensAccountCache, citizenId, account);
                    })
                    .catch(e => {
                      console.log("load citizen error ", e);
                    });
                }
              })
              .catch(this.showError.bind(this));
            TransactionHelper.getAddressPayBackBalance(
              apisInstance,
              account.addr
            )
              .then(payBacks => {
                this.accountPayBacks = [];
                for (let item of payBacks) {
                  const assetId = item[1].asset_id;
                  const asset = this.assetById(assetId);
                  if (!asset) {
                    continue;
                  }
                  const amount = item[1].amount;
                  const amountBn = new BigNumber(amount).div(
                    Math.pow(10, asset.precision)
                  );
                  const amountBnStr = amountBn.toFixed(asset.precision);
                  const obj = {
                    citizenName: item[0],
                    asset: asset,
                    assetId: assetId,
                    amount: amount,
                    amountBn: amountBn,
                    amountBnStr: amountBnStr
                  };
                  this.accountPayBacks.push(obj);
                }
                console.log("payBacks", payBacks);
              })
              .catch(this.showError.bind(this));
            return account;
          });
        })
        .then(() => {})
        .catch(this.showError.bind(this));
    },
    backToList() {
      this.step = "list";
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
    }
  }
};
</script>

<style lang="scss">
.hx-account-lock-balances-panel {
  .-table-header-row {
    .label-font {
      color: #a99eb4;
      font-size: 7pt;
    }
  }
  .-table-body-row {
    margin: 4px 0;
    .label-font {
      color: #a99eb4;
      font-size: 8pt;
    }
  }
  .-panel-title {
    padding: 5px 0;
    text-align: center;
    margin-bottom: 10px;
    color: #666666;
  }
  .-ctrl-btn {
    width: 60px;
    height: 24px;
    line-height: 24px;
    padding: 0;
  }
  .-transfer-asset-select {
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
  .-citizen-select {
    width: 222pt;
  }
  .el-form-item__label {
    color: #a99eb4;
    font-size: 8pt;
  }
  .-input-amount {
    width: 170pt !important;
  }
  .-simple-form-panel {
    max-width: 500px;
    margin: 0 auto;
  }
  .-top-control-panel {
    margin: 2px 0 10px 0;
    text-align: left;
    margin-left: 10px;
    padding-bottom: 10px;
  }
}
</style>
