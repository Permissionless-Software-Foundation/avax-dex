/*
  Mock data for the wallet.adapter.unit.js test file.
*/

const BCHJS = require('@psf/bch-js')
const AvaxWallet = require('minimal-avax-wallet')

const mockWallet = {
  mnemonic:
    'course abstract aerobic deer try switch turtle diet fence affair butter top',
  privateKey: 'L5D2UAam8tvo3uii5kpgaGyjvVMimdrXu8nWGQSQjuuAix6ji1YQ',
  publicKey:
    '0379433ffc401483ade310469953c1cba77c71af904f07c15bde330d7198b4d6dc',
  cashAddress: 'bitcoincash:qzl0d3gcqeypv4cy7gh8rgdszxa9vvm2acv7fqtd00',
  address: 'bitcoincash:qzl0d3gcqeypv4cy7gh8rgdszxa9vvm2acv7fqtd00',
  slpAddress: 'simpleledger:qzl0d3gcqeypv4cy7gh8rgdszxa9vvm2acq9zm7d33',
  legacyAddress: '1JQj1KcQL7GPKzc1D2PvdUSgw3MbDtrHzi',
  hdPath: "m/44'/245'/0'/0/0",
  nextAddress: 1
}

class MockBchWallet {
  constructor () {
    this.walletInfoPromise = true
    this.walletInfo = mockWallet
    this.bchjs = new BCHJS()
    this.burnTokens = async () => {
      return { success: true, txid: 'txid' }
    }
    this.sendTokens = async () => {
      return 'fakeTxid'
    }
    this.getUtxos = async () => { }

    // Environment variable is used by wallet-balance.unit.js to force an error.
    if (process.env.NO_UTXO) {
      this.utxos = {}
    } else {
      this.utxos = {
        utxoStore: {
          address: 'bitcoincash:qqetvdnlt0p8g27dr44cx7h057kpzly9xse9huc97z',
          bchUtxos: [
            {
              height: 700685,
              tx_hash:
                '1fc577caaff5626a8477162581e57bae1b19dc6aa6c10638013c2b1ba14dc654',
              tx_pos: 0,
              value: 1000,
              txid: '1fc577caaff5626a8477162581e57bae1b19dc6aa6c10638013c2b1ba14dc654',
              vout: 0,
              isValid: false
            },
            {
              height: 700685,
              tx_hash:
                '1fc577caaff5626a8477162581e57bae1b19dc6aa6c10638013c2b1ba14dc654',
              tx_pos: 2,
              value: 19406,
              txid: '1fc577caaff5626a8477162581e57bae1b19dc6aa6c10638013c2b1ba14dc654',
              vout: 2,
              isValid: false
            }
          ],
          nullUtxos: [],
          slpUtxos: {
            type1: {
              mintBatons: [],
              tokens: [
                {
                  height: 700522,
                  tx_hash:
                    'bb5691b50930816be78dad76d203a1c97ac94c03f6051b2fa0159c71c43aa3d0',
                  tx_pos: 1,
                  value: 546,
                  txid: 'bb5691b50930816be78dad76d203a1c97ac94c03f6051b2fa0159c71c43aa3d0',
                  vout: 1,
                  utxoType: 'token',
                  transactionType: 'send',
                  tokenId:
                    'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
                  tokenTicker: 'TROUT',
                  tokenName: "Trout's test token",
                  tokenDocumentUrl: 'troutsblog.com',
                  tokenDocumentHash: '',
                  decimals: 2,
                  tokenType: 1,
                  isValid: true,
                  tokenQty: '4.25'
                },
                {
                  height: 0,
                  tx_hash:
                    'c0ac066ce6efa1fa4763bf85a91c738e57c12b8765731bd07f0d8f5a55ce582f',
                  tx_pos: 1,
                  value: 546,
                  txid: 'c0ac066ce6efa1fa4763bf85a91c738e57c12b8765731bd07f0d8f5a55ce582f',
                  vout: 1,
                  utxoType: 'token',
                  transactionType: 'send',
                  tokenId:
                    '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0',
                  tokenTicker: 'PSF',
                  tokenName: 'Permissionless Software Foundation',
                  tokenDocumentUrl: 'psfoundation.cash',
                  tokenDocumentHash: '',
                  decimals: 8,
                  tokenType: 1,
                  isValid: true,
                  tokenQty: '1'
                }
              ]
            },
            nft: {
              groupMintBatons: [],
              groupTokens: [],
              tokens: []
            }
          }
        }
      }
    }
  }
}

class AvalancheWallet {
  constructor (keypair) {
    const avax = new AvaxWallet(keypair, { noUpdate: true })

    this.walletInfoPromise = avax.walletInfoPromise.then(() => {
      if (keypair) {
        this.walletInfo = avax.walletInfo
      }
      return true
    })

    this.tokens = avax.tokens
    this.create = avax.create
    this.ava = avax.ava
    this.bintools = avax.bintools
    this.utxos = avax.utxos
    this.sendAvax = avax.sendAvax
    this.BN = avax.BN
    this.ar = avax.ar

    this.walletInfo = {
      type: 'mnemonic',
      mnemonic: 'stove off mirror shallow rigid language stairs rate mirror other cup aerobic arch brief tower click hand icon parent employ treat animal debate core',
      address: 'X-avax192g35v4jmnarjzczpdqxzvwlx44cfg4p0yk4qd',
      privateKey: 'PrivateKey-8NFb6YinvHtjtfHW3JRm3qoDdQceXEuTRcLRvj3BAxNg3dX7y',
      publicKey: '5iwDpFGJdZXwhNjhC8VinAHT3T7ny3HiYLN2mdJUqK9Z2gorQj',
      avax: 0,
      description: ''
    }

    if (process.env.NO_UTXO) {
      this.utxos.utxoStore = []
      this.utxos.assets = []
    } else {
      this.setUtxos()
    }

    this.ar.issueTx = (baseTx) => 'txid'
  }


  setUtxos () {
    this.utxos.utxoStore = [
      {
        txid: '3LxJXtS6FYkSpcRLPu1EeGZDdFBY41J4YxH1Nwohxs2evUo1U',
        outputIdx: '00000001',
        amount: 1,
        assetID: '2jgTFB6MM4vwLzUNWFYGPfyeQfpLaEqj4XWku6FoW7vaGrrEd5',
        typeID: 6
      },
      {
        txid: 'Fy3NFR7DrriWWNBpogrsgXoAmZpdYcoRHz6n7uW17nRHBVcm3',
        outputIdx: '00000001',
        amount: 380,
        assetID: '2jgTFB6MM4vwLzUNWFYGPfyeQfpLaEqj4XWku6FoW7vaGrrEd5',
        typeID: 7
      },
      {
        txid: 'Fy3NFR7DrriWWNBpogrsgXoAmZpdYcoRHz6n7uW17nRHBVcm3',
        outputIdx: '00000000',
        amount: 18000000,
        assetID: 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z',
        typeID: 7
      }
    ]
    this.utxos.assets = [
      {
        assetID: 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z',
        name: 'Avalanche',
        symbol: 'AVAX',
        denomination: 9,
        amount: 18000000
      },
      {
        assetID: '2jgTFB6MM4vwLzUNWFYGPfyeQfpLaEqj4XWku6FoW7vaGrrEd5',
        name: 'Arepa Token',
        symbol: 'ARP',
        denomination: 2,
        amount: 380
      }
    ]
  }

  async getUtxos () {
    if (process.env.NO_UPDATE) {
      return []
    }

    this.utxos = {
      utxoStore: [
        {
          txid: 'Fy3NFR7DrriWWNBpogrsgXoAmZpdYcoRHz6n7uW17nRHBVcm3',
          outputIdx: '00000000',
          amount: 18000000,
          assetID: 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z',
          typeID: 7
        }
      ],
      assets: [
        {
          assetID: 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z',
          name: 'Avalanche',
          symbol: 'AVAX',
          denomination: 9,
          amount: 18000000
        }
      ]
    }
    return []
  }

  async send (outputs) {
    // just for the sake of tests
    this.outputs = outputs
    return 'someid'
  }

  async burnTokens (amount, assetID) {
    // just for the sake of tests
    this.outputs = [{ amount, assetID }]
    return 'someburnid'
  }

  async listAssets () {
    return [
      {
        assetID: 'Avax',
        name: 'Avalanche',
        symbol: 'AVAX',
        denomination: 9,
        amount: 18000000
      },
      {
        assetID: '2jgTFB6MM4vwLzUNWFYGPfyeQfpLaEqj4XWku6FoW7vaGrrEd5',
        name: 'Arepa Token',
        symbol: 'ARP',
        denomination: 2,
        amount: 380
      }
    ]
  }
}

// UTXOS and UTXOSets
const emptyUTXOSet = {
  getUTXO: () => null
}
const assetUTXOSet = {
  getUTXO: () => true
}

const txString = '111111111GYfFgEkzZP3Csh3c5srhDny6S23q96YQvnKPzg4DmyzVdw9hKQhsttPmn237U' +
  'JdFPFPvfTpN2v8HoKP3TUTRiPmGvvjXn9E9fqV3v9NVPa4ce4spCgS8L8AmG5t2wbhn9Js' +
  'gui2Z6mdXf7ftP7c8grp2qjd6v5rKyQn6V5FtRpNRMvGGpYK5VZb5XsHcgwaGVBp4htSCP' +
  'iiahCnuePHzRdjz6dtzjUJtZMueAwHPMjxJRzw2oE7eTdPWy4Ln6XKXrWGQqzXM3oGg8s3' +
  'k22d2JwKdpEKL3Wb5yGSft72iBbsRgRHE29kNGUirBAqpMzURQCRAdgUAVqxzP3TzyfX6q' +
  'UvTTdbFzX82kLk76jUh9KCBa8zrFzH5jvJWAzaV4rkEuMKASFxqPYyrKJ6SQYWBgdDdQFM' +
  'C7DeD3R9TEM7fLfqWywe2GMmH24mYKYG1sKokqjoyUdL3moTbzfdUwY1kpNMH23jSLBu5e' +
  'vzyvNrFQ9MLG1bYFaHzf6z2M6KtV4kyhk6dXgDktBECxXzkEZq4WEBrtVexoCVaqJfSzE1' +
  'gmXCs3Ym9D9Y2rc1oA8tn9QneZUvdJQmWZ7Ce58ZtJnFZQ9ZAaymPy2qgsLbdE9pQhKNBS' +
  'rVriCdvWqokTGL4a5PiNrCBmqCsrg78DLNGyJZ97cdboUwQQ54RE67x2TBNfufUfo4wS7h' +
  'uKYi1MCbjcKbowsRBKMoWDWhyK4Lk7gVC8W8Ncx9ecc3W6bUuewErdmaaRAUtQtismxucz' +
  '8wZbWe8PmGxEUTruPzo8nVpz4CXniE1FG342t8ey6YHUqBUHqpeHsGbWMc9rQyFHUV8joF' +
  '3Nchxt2s'

module.exports = {
  MockBchWallet,
  mockWallet,
  AvalancheWallet,
  txString,
  emptyUTXOSet,
  assetUTXOSet
}
