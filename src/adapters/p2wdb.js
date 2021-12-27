/*
  Adapter library for interacting with the P2WDB
*/

// Public npm libraries.
const axios = require('axios')
const { Write } = require('p2wdb/index')

// Global constants
const P2WDB_SERVER = 'http://localhost:5001/entry/write'
// const P2WDB_SERVER = 'https://p2wdb.fullstack.cash/entry/write'

class P2wdbAdapter {
  constructor (localConfig = {}) {
    // Encapsulate dependencies
    this.axios = axios
    this.Write = Write
    this.bchjs = localConfig.bchjs || {}
  }

  async checkForSufficientFunds (wif) {
    try {
      if (typeof wif !== 'string' || !wif) {
        throw new Error('invalid wif to check for funds')
      }

      const p2write = new this.Write({
        wif,
        restURL: this.bchjs.restURL,
        apiToken: this.bchjs.apiToken
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
        restURL: this.bchjs.restURL,
        apiToken: this.bchjs.apiToken
      })

      // TODO: update the p2wdb to accept custom servers
      // meanwhite this trick works
      p2write.axios = this.axiosClient()

      // TODO: Input validation

      const result = await p2write.postEntry(data, appId)
      return result.hash
    } catch (err) {
      console.error('Error in p2wdb.js/write()')
      throw err
    }
  }

  axiosClient () {
    const client = axios.create()
    client.post = async (url, data) => {
      console.log(`Changed ${url} for ${P2WDB_SERVER}`)
      return this.axios.post(P2WDB_SERVER, data)
    }

    return client
  }
}

module.exports = P2wdbAdapter
