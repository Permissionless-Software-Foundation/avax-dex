/*
  Adapter library for interacting with the P2WDB
*/

// Public npm libraries.
const axios = require('axios')
const { Write, Read } = require('p2wdb/index')

// local libraries
const config = require('../../config')

// Global constants
// const P2WDB_SERVER = 'http://localhost:5001'
const P2WDB_SERVER = `http://localhost:${config.p2wdbPort}`
// const P2WDB_SERVER = 'https://p2wdb.fullstack.cash/entry/write'

class P2wdbAdapter {
  constructor (localConfig = {}) {
    // Encapsulate dependencies
    this.axios = axios
    this.Write = Write
    this.Read = Read
    this.bchjs = localConfig.bchjs || {}
    this.p2wdbURL = localConfig.p2wdbURL || P2WDB_SERVER
    this.config = config
  }

  async checkForSufficientFunds (wif) {
    try {
      if (typeof wif !== 'string' || !wif) {
        throw new Error('invalid wif to check for funds')
      }

      const p2write = new this.Write({
        wif,
        restURL: this.config.bchRestUrl,
        interface: this.config.bchInterface
      })
      return p2write.checkForSufficientFunds()
    } catch (error) {
      console.error('Error in p2wdb.js/checkForSufficientFunds()')
      throw error
    }
  }

  async write (inputObj = {}) {
    try {
      const { appId, data, wif } = inputObj
      const p2write = new this.Write({
        wif,
        serverURL: this.p2wdbURL,
        restURL: this.config.bchRestUrl,
        interface: this.config.bchInterface
      })

      // TODO: Input validation

      const result = await p2write.postEntry(data, appId)
      return result.hash
    } catch (err) {
      console.error('Error in p2wdb.js/write()')
      throw err
    }
  }
}

module.exports = P2wdbAdapter
