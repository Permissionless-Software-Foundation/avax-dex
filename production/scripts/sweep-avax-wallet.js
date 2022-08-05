/*
  This script will loop through each child address of the AVAX HD wallet.
  It will sweep any funds found into the root address.
*/

const WalletAdapter = require('../../src/adapters/wallet')
const MinimalAvaxWallet = require('minimal-avax-wallet/index')

async function sweepWallet () {
  try {
    // Instantiate the wallet adapter library.
    const walletLib = new WalletAdapter()

    // Open the AVAX wallet.
    const avaxWalletData = await walletLib.openWallet(true)
    await walletLib.instanceAvaxWallet(avaxWalletData)
    console.log('avaxWalletData: ', avaxWalletData)

    const addrEnd = avaxWalletData.nextAddress

    // Instantiate the wallet library
    const rootWallet = new MinimalAvaxWallet(avaxWalletData.mnemonic)
    await rootWallet.walletInfoPromise
    console.log('rootWallet info: ', rootWallet.walletInfo)

    const rootAssets = await rootWallet.listAssets()
    console.log('Root address balances: ', rootAssets)

    for (let i = 1; i < addrEnd; i++) {
    // for (let i = 1; i < 4; i++) {
      // Get the keypairs for this child wallet.
      const childKeyPair = await walletLib.getAvaxKeyPair(i)
      // console.log('childKeyPair: ', childKeyPair.getPrivateKeyString())

      const childPrivKey = childKeyPair.getPrivateKeyString()

      // Instantiate a wallet for the child HD
      const childWallet = new MinimalAvaxWallet(childPrivKey)
      await childWallet.walletInfoPromise
      console.log('childWallet.walletInfo: ', childWallet.walletInfo)

      const childAddr = childWallet.walletInfo.address

      const childAssets = await childWallet.listAssets()
      console.log('childAssets: ', childAssets)

      if (childAssets.length) {
        for (let j = 0; j < childAssets.length; j++) {
          const thisChildAsset = childAssets[j]
          console.log('thisChildAsset: ', thisChildAsset)

          if (thisChildAsset.assetID === 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z') {
            console.log('Skipping AVAX asset.')
            continue
          }

          // Update the UTXOs in the root wallet.
          await sleep(5000)
          await rootWallet.getUtxos()

          // Send some AVAX to the child address.
          const txid1 = await rootWallet.send([{
            address: childAddr,
            assetId: 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z',
            amount: 1000002
          }])
          console.log(`Funded child address ${i} with 0.001 AVAX from root wallet. TXID: ${txid1}`)

          // Wait for the transaction to finalize
          await sleep(5000)

          // Update the UTXOs in the child wallet.
          const childUtxos = await childWallet.getUtxos()
          console.log('childUtxos: ', childUtxos)

          console.log('thisChildAsset (after utxo refresh): ', thisChildAsset)

          // Transfer the asset to the root wallet.
          const txid2 = await childWallet.send([{

            address: avaxWalletData.address,
            assetId: thisChildAsset.assetID,
            amount: thisChildAsset.amount
          }])
          console.log(`${thisChildAsset.amount} ${thisChildAsset.symbol} sent to root address. TXID: ${txid2}`)
        }
      }
    }
  } catch (err) {
    console.error('Error in sweepWallet(): ', err)
  }
}
sweepWallet()

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
