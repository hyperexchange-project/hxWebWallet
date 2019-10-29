import appState from '../../appState'
import tokenRpc from '../../rpc/token'
import utils from '../../utils'

const state = {
    account: {
        accountInfos: {}, // address => accountInfo
        addressBalances: {}, // address => balances
        addressTokenBalances: {}, // address => tokenBalances
    }
}

const mutations = {
    CHANGE_ACCOUNT_INFO(state, { address, accountInfo }) {
        state.account.accountInfos[address] = accountInfo
        if (navigator.onLine && window.localStorage) {
            utils.localSetItem(`accountInfo.${address}`, accountInfo)
        }
    },
    CHANGE_ADDRESS_BALANCES(state, { address, balances }) {
        state.account.addressBalances[address] = balances
        if (navigator.onLine && window.localStorage) {
            utils.localSetItem(`addressBalances.${address}`, balances)
        }
    },
    CHANGE_ADDRESS_TOKEN_BALANCES(state, { address, tokenBalances }) {
        state.account.addressTokenBalances[address] = tokenBalances
        if (navigator.onLine && window.localStorage) {
            utils.localSetItem(`addressTokenBalances.${address}`, tokenBalances)
        }
    },
}

const actions = {
    changeAccountInfo({ commit }, accountInfo) {
        commit('CHANGE_ACCOUNT_INFO', { address: accountInfo.address, accountInfo })
    },
    getAccountInfo({ commit, state }, address) {
        if (!navigator.onLine) {
            if (window.localStorage) {
                const result = utils.localGetItem(`accountInfo.${address}`)
                if (result) {
                    commit('CHANGE_ACCOUNT_INFO', { address, accountInfo: result })
                    console.log(`getAccountInfo of ${address} from cache`)
                    return Promise.resolve(result)
                }
            }
            return Promise.reject('connection failed')
        }
        const nodeClient = appState.getNodeClient();
        return appState
            .withSystemAssets()
            .then(() => {
                return nodeClient
                    .getAccountByAddresss(address)
                    .then(accountInfo => {
                        if (accountInfo) {
                            commit('CHANGE_ACCOUNT_INFO', { address, accountInfo })
                        } else {
                            commit('CHANGE_ACCOUNT_INFO', address, null)
                        }
                        return accountInfo
                    });
            })
    },
    getAddressBalances({ commit, state }, address) {
        if (!navigator.onLine) {
            if (window.localStorage) {
                const result = utils.localGetItem(`addressBalances.${address}`)
                if (result) {
                    for (let item of result) {
                        item.amountNu = new BigNumber(item.amountNu)
                    }
                    commit('CHANGE_ADDRESS_BALANCES', { address, balances: result })
                    console.log(`getAddressBalances of ${address} from cache`)
                    return Promise.resolve(result)
                }
            }
            return Promise.reject('connection failed')
        }

        const nodeClient = appState.getNodeClient();
        let assets = null
        return appState
            .withSystemAssets()
            .then(systemAssets => {
                assets = systemAssets
                return nodeClient.getAddrBalances(address)
            })
            .then(balances => {
                const accountBalances = []
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
                    accountBalances.push(item);
                }
                if (accountBalances.length === 0) {
                    accountBalances.push(utils.emptyHxBalance)
                }
                return accountBalances;
            })
            .then(accountBalances => {
                commit('CHANGE_ADDRESS_BALANCES', { address, balances: accountBalances })
                return accountBalances
            })
    },
    getAddressTokenBalances({ commit, state }, address) {
        if (!navigator.onLine) {
            if (window.localStorage) {
                const result = utils.localGetItem(`addressTokenBalances.${address}`)
                if (result) {
                    commit('CHANGE_ADDRESS_TOKEN_BALANCES', { address, tokenBalances: result })
                    console.log(`getAddressTokenBalances of ${address} from cache`)
                    return Promise.resolve(result)
                }
            }
            return Promise.reject('connection failed')
        }
        return tokenRpc
            .listUserTokenBalances(
                appState.getTokenExplorerApiUrl(),
                address,
                100,
                0
            )
            .then(data => {
                const res = data.data.listUserTokenBalances;
                const tokenBalances = res.items;
                commit('CHANGE_ADDRESS_TOKEN_BALANCES', { address, tokenBalances })
                return tokenBalances
            })
    },
}

export default {
    namespaced: true,
    state,
    mutations,
    actions
}
