/*
  REST API library for /mnemonic route.
  This is called by the front end to retrieve the wallet mneomnics used by this
  app.
*/

// Public npm libraries.
const Router = require('koa-router')

// Local libraries.
const MnemonicRESTControllerLib = require('./controller')

let _this

class MnemonicRouter {
  constructor (localConfig = {}) {
    // Dependency Injection.
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of Adapters library required when instantiating /mnemonic REST Controller.'
      )
    }
    this.useCases = localConfig.useCases
    if (!this.useCases) {
      throw new Error(
        'Instance of Use Cases library required when instantiating /mnemonic REST Controller.'
      )
    }

    const dependencies = {
      adapters: this.adapters,
      useCases: this.useCases
    }

    // Encapsulate dependencies.
    this.mnemonicRESTController = new MnemonicRESTControllerLib(dependencies)

    // Instantiate the router and set the base route.
    const baseUrl = '/mnemonic'
    this.router = new Router({ prefix: baseUrl })

    _this = this
  }

  attach (app) {
    if (!app) {
      throw new Error(
        'Must pass app object when attached REST API controllers.'
      )
    }

    // Define the routes and attach the controller.
    // this.router.post('/', _this.orderRESTController.createOrder)
    // this.router.get('/list', _this.orderRESTController.listOrders)
    // this.router.post('/take', _this.orderRESTController.takeOrder)

    this.router.get('/', _this.mnemonicRESTController.getMnemonics)
    this.router.get('/price', _this.mnemonicRESTController.getPrice)

    // Attach the Controller routes to the Koa app.
    app.use(_this.router.routes())
    app.use(_this.router.allowedMethods())
  }
}

module.exports = MnemonicRouter
