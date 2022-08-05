/*
  Mocks for the Adapter library.
*/

const BCHJS = require('@psf/bch-js')
const bchjs = new BCHJS()

class IpfsAdapter {
  constructor () {
    this.ipfs = {
      files: {
        stat: () => {}
      }
    }
  }
}

class IpfsCoordAdapter {
  constructor () {
    this.ipfsCoord = {
      useCases: {
        peer: {
          sendPrivateMessage: () => { }
        }
      }
    }
  }
}

const ipfs = {
  ipfsAdapter: new IpfsAdapter(),
  ipfsCoordAdapter: new IpfsCoordAdapter()
}
ipfs.ipfs = ipfs.ipfsAdapter.ipfs

const localdb = {
  Users: class Users {
    static findById () { }
    static find () { }
    static findOne () {
      return {
        validatePassword: localdb.validatePassword
      }
    }

    async save () {
      return {}
    }

    generateToken () {
      return '123'
    }

    toJSON () {
      return {}
    }

    async remove () {
      return true
    }

    async validatePassword () {
      return true
    }
  },

  validatePassword: () => {
    return true
  },

  Entry: class Entry {
    constructor (obj) {
      ; (this._id = 'id'), (this.entry = obj.entry)
      this.slpAddress = obj.slpAddress
      this.description = obj.description
      this.signature = obj.signature
      this.category = obj.category
      this.balance = obj.balance
      this.merit = obj.merit
    }

    static findById () { }
    static find () { }
    static findOne () { }

    async save () {
      return {}
    }
  },

  Order: class Order {
    constructor (obj) { }

    static findById () { }
    static find () { }
    static findOne () { }

    async save () {
      return {}
    }
  },

  Offer: class Offer {
    constructor (obj) { }

    static findById () { }
    static find () { }
    static findOne () { }

    async save () {
      return {}
    }
  }
}

const bch = {
  getMerit: async () => {
    return 100
  },
  getPSFTokenBalance: async () => {
    return 100
  },
  _verifySignature: () => {
    return true
  }
}

// const wallet = {
//   burnPsf: async () => {},
//   generateSignature: async () => {}
// }
const { MockBchWallet, AvalancheWallet } = require('./wallet')
const { Write } = require('./p2wdb-mock')
const wallet = {
  burnPsf: async () => { },
  generateSignature: async () => { },
  getKeyPair: async () => {
    return { cashAddress: 'fakeAddr', wif: 'fakeWif', hdIndex: 1 }
  },
  getAvaxKeyPair: async (index) => {
    return {
      getAddressString: () => 'X-avax192g35v4jmnarjzczpdqxzvwlx44cfg4p0yk4qd',
      getPrivateKeyString: () => 'PrivateKey-8NFb6YinvHtjtfHW3JRm3qoDdQceXEuTRcLRvj3BAxNg3dX7y',
      getPublicKeyString: () => '5iwDpFGJdZXwhNjhC8VinAHT3T7ny3HiYLN2mdJUqK9Z2gorQj',
      hdIndex: index
    }
  },
  createPartialTxHex: () => { },
  takePartialTxHex: () => { },
  getTxOut: () => { },
  findTxOut: () => { },
  validateIntegrity: () => { },
  completeTxHex: () => { },
  bchWallet: new MockBchWallet(),
  avaxWallet: new AvalancheWallet(),
  getTransaction: async () => {}
}

const p2wdb = {
  checkForSufficientFunds: async () => true,
  write: async () => { hash: 'testhash' },
}

module.exports = { ipfs, localdb, bch, wallet, p2wdb, bchjs }
