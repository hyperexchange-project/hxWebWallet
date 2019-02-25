import EventEmitter from "eventemitter3";

const EE = new EventEmitter();

const networkList = [
    {
        chainId: '2e13ba07b457f2e284dcfcbd3d4a3e4d78a6ed89a61006cdb7fdad6d67ef0b12', key: 'mainnet', name: "Mainnet",
        // url: "ws://211.159.168.197:6090"
        url: "wss://nodeapi.hxlab.org:443"
        // url: "ws://localhost:8090"
    },
    { chainId: '9f3b24c962226c1cb775144e73ba7bb177f9ed0b72fac69cd38764093ab530bd', key: 'testnet', name: "Testnet", url: "ws://47.74.44.110:8090" },
    {
        //  chainId: 'fe70279c1d9850d4ddb6ca1f00c577bc2e86bf33d54fafd4c606a6937b89ae32', // local testnet
        chainId: '2e13ba07b457f2e284dcfcbd3d4a3e4d78a6ed89a61006cdb7fdad6d67ef0b12', // local mainnet
        key: 'localhost', name: "localhost:8090", url: "ws://localhost:8090"
    }
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

if (typeof localStorage !== "undefined") {
    try {
        let fileJson = localStorage.getItem("keyInfo");
        let password = localStorage.getItem("keyPassword");
        if (fileJson && fileJson !== 'null' && password) {
            fileJson = JSON.parse(fileJson);
            let account = account_utils.NewAccount();
            account.fromKey(fileJson, password);
            let address = account.getAddressString("HX");
            account.address = address;
            state.currentAccount = account;
            state.currentAddress = address;
        }
    } catch (e) {
        console.log(e);
    }
}


const changeCurrentTabEventName = "changeCurrentTab";
const changeCurrentNetworkEventName = "changeCurrentNetwork";
const changeCurrentLanguageEventName = "changeCurrentLanguage";
const changeCurrentAccountEventName = "changeCurrentAccount";
const changeCurrentAddressEventName = "changeCurrentAddress";
const pushFlashTxMessageEventName = "pushFlashTxMessage";

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
            state.nodeClient = new NodeClient(state.apisInstance);
            if (typeof (localSave) !== 'undefined') {
                localSave.setItem("networkKey", networkObj.key);
                localSave.setItem("apiPrefix", chainRpcUrl);
                localSave.setItem("chainId", networkObj.chainId);
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
};