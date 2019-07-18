import EventEmitter from "eventemitter3";

const EE = new EventEmitter();

const networkList = [
    {
        chainId: '2e13ba07b457f2e284dcfcbd3d4a3e4d78a6ed89a61006cdb7fdad6d67ef0b12', key: 'mainnet', name: "Mainnet",
        // url: "ws://211.159.168.197:6090"
        // url: "wss://nodeapi.hxlab.org:443"
        // url: "ws://nodeapi.hxlab.org:6090"
        url: "ws://211.159.168.197:6090"
    },
    { chainId: '9f3b24c962226c1cb775144e73ba7bb177f9ed0b72fac69cd38764093ab530bd', key: 'testnet', name: "Testnet", url: "ws://47.74.44.110:8090" },
    {
        //  chainId: 'fe70279c1d9850d4ddb6ca1f00c577bc2e86bf33d54fafd4c606a6937b89ae32', // local testnet
        chainId: '2e13ba07b457f2e284dcfcbd3d4a3e4d78a6ed89a61006cdb7fdad6d67ef0b12', // local mainnet
        key: 'localhost', name: "localhost:8090", url: "ws://localhost:8090"
    },
    {
        chainId: '2e13ba07b457f2e284dcfcbd3d4a3e4d78a6ed89a61006cdb7fdad6d67ef0b12', key: 'indicator', name: "Indicator",
        url: "ws://localhost:50320"
    },
    {
        chainId: '2c5729a8f02e0431233528a3db625a7b0f83aa7c9f561d9bd73886d993a57161', key: 'regtest', name: "Regtest",
        url: "ws://localhost:60320",
        address_prefix: "HXT",
    },
    {
        chainId: '2c5729a8f02e0431233528a3db625a7b0f83aa7c9f561d9bd73886d993a57161', key: 'regtest121', name: "Regtest121",
        url: "ws://192.168.1.121:30000",
        address_prefix: "HXT",
    },
    {
        chainId: '2c5729a8f02e0431233528a3db625a7b0f83aa7c9f561d9bd73886d993a57161', key: 'regtest121b', name: "Regtest121b",
        url: "ws://192.168.1.121:30002",
        address_prefix: "HXT",
    },
    {
        chainId: '22f71d13b03b4e83918957fddb4d1441513e830a885936def665fddc77a85ee8', key: 'testnet2',
        name: 'Testnet2', url: "ws://192.168.1.121:60038",
    },
    {
        chainId: '08d1d10092bbdbb68c1613c93ded434805381fe73e845c59b5a97693fa1a778e', key: 'dexTestnet', name: 'DexTestnet', url: 'ws://192.168.1.122:10055',
    },
];

function getNetworkByKey(networkKey) {
    for (let n of networkList) {
        if (n.key === networkKey) {
            return n;
        }
    }
    return null;
}

const state = {
    currentTab: 'my_wallet',
    currentTabParams: null,
    currentNetwork: null,
    currentLanguage: 'chinese',
    currentKeystoreFileJson: null,
    currentKeystorePassword: '',
    currentAccount: null,
    currentAddress: null,
    apisInstance: null,
    nodeClient: null,

    systemAssets: [], // [{id: ..., symbol: ..., precision: ..., issuer: ..., options: ..., current_feed: ...}]

    flashTxMessage: null, // received tx message from postMessage 

    hxPayCallback: null,
    lastSerialNumber: null,
};

// TODO: read current account from chrome.storage

let { PrivateKey, key, TransactionBuilder, TransactionHelper, NodeClient } = hx_js;
let { Apis, ChainConfig } = hx_js.bitshares_ws;

// TODO: read last used chainId or default
ChainConfig.setChainId(
    "2e13ba07b457f2e284dcfcbd3d4a3e4d78a6ed89a61006cdb7fdad6d67ef0b12"
);

function setStorage(key, value) {
    if (typeof localStorage !== "undefined") {
        try {
            return localStorage.setItem(key, value);
        } catch (e) {

        }
    }
}

function getStorage(key) {
    if (typeof localStorage !== "undefined") {
        try {
            return localStorage.getItem(key);
        } catch (e) {

        }
    }
}

function setCurrentAccount() {
    if (typeof localStorage !== "undefined") {
        try {
            let fileJson = localStorage.getItem("keyInfo");
            let password = localStorage.getItem("keyPassword");
            if (fileJson && fileJson !== 'null' && password) {
                fileJson = JSON.parse(fileJson);
                let account = account_utils.NewAccount();
                account.fromKey(fileJson, password);
                account.address = null;
                let address = account.getAddressString("HX");
                account.address = address;
                state.currentAccount = account;
                state.currentAddress = address;
            }
        } catch (e) {
            console.log(e);
        }
    }
}

setCurrentAccount();


const changeCurrentTabEventName = "changeCurrentTab";
const changeCurrentNetworkEventName = "changeCurrentNetwork";
const changeCurrentLanguageEventName = "changeCurrentLanguage";
const changeCurrentAccountEventName = "changeCurrentAccount";
const changeCurrentAddressEventName = "changeCurrentAddress";
const pushFlashTxMessageEventName = "pushFlashTxMessage";
const connectionCloseEventName = "connectionClose";

const languageConfigStorageKey = "languageConfig";

state.currentLanguage = getStorage(languageConfigStorageKey) || "chinese";

function getLocationHash() {
    if (typeof (location) !== 'undefined') {
        return location.hash;
    } else {
        return '';
    }
}

function parseQuery(queryString) {
    var query = {};
    var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
}

// receive params
const locationHash = getLocationHash();
switch (locationHash) {
    case '#transfer': {
        state.currentTab = 'transfer';
    } break;
    case '#invoke_contract': {
        state.currentTab = 'contract';
    } break;
    case '#transfer_to_contract': {
        state.currentTab = 'contract';
        state.currentTabParams = ['transfer_to_contract'];
    } break;
    case '#check_tx': {
        state.currentTab = 'check_tx';
        state.currentTabParams = [];
    } break;
    case '#sign_raw': {
        state.currentTab = 'sign_raw';
        state.currentTabParams = [];
    } break;
    default: {
        if (locationHash && locationHash.indexOf('#locktocitizen=') === 0) {
            const lockToCitizenName = locationHash.substr('#locktocitizen='.length);
            state.currentTab = 'my_wallet';
            state.currentTabParams = ['locktocitizen', lockToCitizenName];
        }
    }
}
location.hash = '';

export default {
    EE,
    hxPrecision: 5,
    pushFlashTx(txMsg) {
        state.flashTxMessage = txMsg;
        console.log("receive flash tx message", txMsg);
        if (txMsg) {
            if (txMsg.callback) {
                state.hxPayCallback = txMsg.callback;
            }
            if (txMsg.serialNumber) {
                state.lastSerialNumber = txMsg.serialNumber;
            }
        }
        EE.emit(pushFlashTxMessageEventName, txMsg);
    },
    getFlashTxOnce() {
        const msg = state.flashTxMessage;
        state.flashTxMessage = null;
        return msg;
    },
    onPushFlashTxMessage(listener) {
        EE.on(pushFlashTxMessageEventName, listener);
    },
    offPushFlashTxMessage(listener) {
        EE.off(pushFlashTxMessageEventName, listener);
    },
    changeCurrentTab(tabKey, params) {
        state.currentTab = tabKey;
        state.currentTabParams = params;
        EE.emit(changeCurrentTabEventName, state.currentTab, params);
    },
    onChangeCurrentTab(listener) {
        EE.on(changeCurrentTabEventName, listener);
    },
    offChangeCurrentTab(listener) {
        EE.off(changeCurrentTabEventName, listener);
    },
    getCurrentTab() {
        return state.currentTab;
    },
    getCurrentTabParams() {
        return state.currentTabParams;
    },
    clearCurrentTabParams() {
        state.currentTabParams.length = 0;
    },

    changeCurrentAccount(account) {
        state.currentAccount = account;
        if (state.currentAddress !== account.address) {
            this.changeCurrentAddress(account.address);
        }
        EE.emit(changeCurrentAccountEventName, state.currentAccount);
    },
    getCurrentAccount() {
        return state.currentAccount;
    },
    onChangeCurrentAccount(listener) {
        EE.on(changeCurrentAccountEventName, listener);
    },
    offChangeCurrentAccount(listener) {
        EE.off(changeCurrentAccountEventName, listener);
    },

    changeCurrentAddress(address) {
        state.currentAddress = address;
        EE.emit(changeCurrentAddressEventName, state.currentAddress);
    },
    getCurrentAddress() {
        return state.currentAddress;
    },
    onChangeCurrentAddress(listener) {
        EE.on(changeCurrentAddressEventName, listener);
    },
    offChangeCurrentAddress(listener) {
        EE.off(changeCurrentAddressEventName, listener);
    },
    onConnectionClose(listener) {
        EE.on(connectionCloseEventName, listener);
    },
    offConnectionClose(listener) {
        EE.off(connectionCloseEventName, listener);
    },
    getLastUsedNetwork() {
        if (typeof (localSave) === 'undefined') {
            return null;
        }
        const key = localSave.getItem("networkKey");
        if (!key) {
            return null;
        }
        const networkObj = getNetworkByKey(key);
        return networkObj;
    },
    changeCurrentNetwork(network) {
        network = network || 'mainnet';
        if (state.currentNetwork === network) {
            return;
        }
        const oldNetwork = state.currentNetwork;
        state.currentNetwork = network;
        const networkObj = getNetworkByKey(network);
        if (networkObj) {
            const chainRpcUrl = networkObj.url;
            state.apisInstance = Apis.instance(chainRpcUrl, true);
            state.apisInstance.closeCb = () => {
                EE.emit(connectionCloseEventName);
            };
            window.apisInstance = state.apisInstance;
            state.nodeClient = new NodeClient(state.apisInstance);
            if (typeof (localSave) !== 'undefined') {
                localSave.setItem("networkKey", networkObj.key);
                localSave.setItem("apiPrefix", chainRpcUrl);
                localSave.setItem("chainId", networkObj.chainId);
            }
            ChainConfig.setChainId(networkObj.chainId);
            ChainConfig.address_prefix = networkObj.address_prefix || "HX";
            if (state.currentAccount) {
                let account = state.currentAccount;
                account.address = null;
                let address = account.getAddressString(ChainConfig.address_prefix);
                account.address = address;
            }
        }
        EE.emit(changeCurrentNetworkEventName, state.currentNetwork);
        if (oldNetwork && oldNetwork != network) {
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    },
    getApisInstance() {
        return state.apisInstance;
    },
    getNodeClient() {
        return state.nodeClient;
    },
    withApis() {
        const nodeClient = this.getNodeClient();
        if (!nodeClient) {
            return null;
        }
        return nodeClient.afterInited();
    },
    withSystemAssets() {
        const nodeClient = this.getNodeClient();
        if (!nodeClient) {
            return null;
        }
        if (state.systemAssets.length > 0) {
            return Promise.resolve(state.systemAssets);
        }
        return this.withApis().then(() => {
            return nodeClient.listAssets("", 100)
                .then((assets) => {
                    state.systemAssets = assets;
                    return assets;
                });
        });
    },
    getSystemAssets() {
        return state.systemAssets;
    },
    getAssetLocal(assetId) {
        if (!state.systemAssets) { return null; }
        for (let asset of state.systemAssets) {
            if (asset.id === assetId) {
                return asset;
            }
        }
        return null;
    },
    getAssetPrecisionByAssetId(assetId) {
        const asset = this.getAssetLocal(assetId);
        if (asset) {
            return asset.precision;
        } else {
            if (assetId === '1.3.0') {
                return 5; // HX precision
            } else {
                return 8; // default precision
            }
        }
    },
    bindPayId(txid, payId, callback) {
        // bind txid with serial number to hxpaypush
        let hxPayPushApiUrl = callback || state.hxPayCallback || "http://wallet.hx.cash/api";
        payId = payId || state.lastSerialNumber;
        if (!payId || !txid) {
            return;
        }
        try {
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () { };
            xhr.open("POST", hxPayPushApiUrl, true);
            xhr.send(
                JSON.stringify({
                    jsonrpc: "2.0",
                    id: 1,
                    method: "BindPayId",
                    params: [payId, txid]
                })
            );
        } catch (e) {
            console.log("BindPayId request error", e);
        }
    },
    onChangeCurrentNetwork(listener) {
        EE.on(changeCurrentNetworkEventName, listener);
    },
    offChangeCurrentNetwork(listener) {
        EE.off(changeCurrentNetworkEventName, listener);
    },
    getCurrentNetwork() {
        return state.currentNetwork;
    },
    changeCurrentLanguage(lang) {
        state.currentLanguage = lang;
        setStorage(languageConfigStorageKey, lang);
        EE.emit(changeCurrentLanguageEventName, state.currentLanguage);
    },
    onChangeCurrentLanguage(listener) {
        EE.on(changeCurrentLanguageEventName, listener);
    },
    offChangeCurrentLanguage(listener) {
        EE.off(changeCurrentLanguageEventName, listener);
    },
    getCurrentLanguage() {
        return state.currentLanguage;
    },
    getAddressPrefix() {
        return ChainConfig.address_prefix;
    }
};
