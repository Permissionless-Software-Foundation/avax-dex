/*
  This is a top-level library that encapsulates all the additional Adapters.
  The concept of Adapters comes from Clean Architecture:
  https://troutsblog.com/blog/clean-architecture
*/

// Public NPM libraries
const BCHJS = require('@psf/bch-js')

// Load individual adapter libraries.
const IPFSAdapter = require('./ipfs')
const LocalDB = require('./localdb')
const LogsAPI = require('./logapi')
const Passport = require('./passport')
const Nodemailer = require('./nodemailer')
// const { wlogger } = require('./wlogger')
const JSONFiles = require('./json-files')
const FullStackJWT = require('./fullstack-jwt')
const BCHAdapter = require('./bch')
const WalletAdapter = require('./wallet')
const P2wdbAdapter = require('./p2wdb')

const config = require('../../config')

class Adapters {
  constructor (localConfig = {}) {
    // Encapsulate dependencies
    this.ipfs = new IPFSAdapter()
    this.localdb = new LocalDB()
    this.logapi = new LogsAPI()
    this.passport = new Passport()
    this.nodemailer = new Nodemailer()
    this.jsonFiles = new JSONFiles()
    this.bchjs = new BCHJS()
    localConfig.bchjs = this.bchjs
    this.bch = new BCHAdapter()
    this.config = config
    this.wallet = new WalletAdapter()
    this.p2wdb = new P2wdbAdapter(localConfig)

    // Get a valid JWT API key and instance bch-js.
    this.fullStackJwt = new FullStackJWT(config)
  }

  async start () {
    try {
      if (this.config.getJwtAtStartup) {
        // Get a JWT token and instantiate bch-js with it. Then pass that instance
        // to all the rest of the apps controllers and adapters.
        await this.fullStackJwt.getJWT()
        // Instantiate bch-js with the JWT token, and overwrite the placeholder for bch-js.
        this.bchjs = await this.fullStackJwt.instanceBchjs()
      }

      // Start the IPFS node.
      // await this.ipfs.start()

      // Open the wallet files
      const bchWallet = await this.wallet.openWallet(false)
      const avaxWallet = await this.wallet.openWallet(true)
      // console.log('walletData: ', walletData)

      this.p2wdb = new P2wdbAdapter({ bchjs: this.bchjs })

      // Instance the wallets.
      await this.wallet.instanceBchWallet(bchWallet, this.bchjs)
      await this.wallet.instanceAvaxWallet(avaxWallet)

      console.log('Async Adapters have been started.')

      return true
    } catch (err) {
      console.error('Error in adapters/index.js/start()')
      throw err
    }
  }
}

module.exports = Adapters
