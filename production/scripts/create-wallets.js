/*
  This app will create new wallet files for both AVAX and BCH.

  This will overwrite any existing wallet files in the root directory.
*/

// Public NPM libraries
const AvaxWallet = require('minimal-avax-wallet/index')
const fs = require('fs').promises
const BchWallet = require('minimal-slp-wallet/index')

createAvaxWallet()
createBchWallet()

async function createAvaxWallet() {
  const config = {
    interface: 'json-rpc',
    noUpdate: true
  }

  const avaxWallet = new AvaxWallet(undefined, config)
  await avaxWallet.walletInfoPromise

  console.log('avaxWallet: ', avaxWallet.walletInfo)

  await fs.writeFile('../../wallet-avax.json', JSON.stringify(avaxWallet.walletInfo, null, 2))
}

async function createBchWallet() {
  const config = {
    interface: 'consumer-api',
    noUpdate: true
  }

  const bchWallet = new BchWallet(undefined, config)
  await bchWallet.walletInfoPromise

  console.log('bch  wallet: ', bchWallet.walletInfo)

  await fs.writeFile('../../wallet-bch.json', JSON.stringify(bchWallet.walletInfo, null, 2))
}
