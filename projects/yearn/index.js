const axios = require('axios')
const {getPricesfromString} = require('../helper/utils')
const { toUSDTBalances } = require('../helper/balances')
const sdk = require('@defillama/sdk')

async function ethereum(timestamp) {
    if(Math.abs(timestamp-Date.now()/1000)<3600){
        const tvl = await axios.get('https://api.yearn.finance/v1/chains/1/vaults/all')
        return toUSDTBalances(tvl.data.reduce((all, vault)=>all+vault.tvl.tvl, 0))
    }
    const historicalTvls = Object.entries((await axios.get('https://yearn.science/v1/tvl')).data)
        .map(([date, tvl]) => [Date.parse(date)/1000, tvl]).sort(([date1], [date2]) => date1 - date2);
    let high = historicalTvls.length;
    let low = 0;
    while ((high - low) > 1) {
        const mid = Math.floor((high + low) / 2);
        const midTimestamp = historicalTvls[mid][0]
        if (midTimestamp < timestamp) {
            low = mid;
        } else {
            high = mid;
        }
    }
    if(Math.abs(historicalTvls[low][0]-timestamp)>(24*3600)){
        throw new Error('no data');
    }
    return toUSDTBalances(historicalTvls[low][1])
}

async function fantom(){
    const vaults = (await axios.get("https://api.yearn.finance/v1/chains/250/vaults/all")).data
    const total = vaults.reduce((sum, vault)=>sum+vault.tvl.tvl, 0)
    return toUSDTBalances(total)
}


module.exports = {
    misrepresentedTokens: true,
    timetravel: false,
    fantom:{
        tvl: fantom
    },
    ethereum:{
        tvl: ethereum
    },
};
