/*
  This index file for the Clean Architecture Controllers loads dependencies,
  creates instances, and attaches the controller to REST API endpoints for
  Koa.
*/

// Public npm libraries.

// Load the REST API Controllers.
const AuthRESTController = require('./auth')
const UserRouter = require('./users')
const ContactRESTController = require('./contact')
const LogsRESTController = require('./logs')
const EntryRouter = require('./entry')
const OfferRouter = require('./offer')
const OrderRouter = require('./order')
const MnemonicRouter = require('./mnemonic')
const P2WDBRouter = require('./p2wdb')

class RESTControllers {
  constructor (localConfig = {}) {
    // Dependency Injection.
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of Adapters library required when instantiating REST Controller libraries.'
      )
    }
    this.useCases = localConfig.useCases
    if (!this.useCases) {
      throw new Error(
        'Instance of Use Cases library required when instantiating REST Controller libraries.'
      )
    }

    // console.log('Controllers localConfig: ', localConfig)
  }

  attachRESTControllers (app) {
    const dependencies = {
      adapters: this.adapters,
      useCases: this.useCases
    }

    // Attach the REST API Controllers associated with the /auth route
    const authRESTController = new AuthRESTController(dependencies)
    authRESTController.attach(app)

    // Attach the REST API Controllers associated with the /user route
    const userRouter = new UserRouter(dependencies)
    userRouter.attach(app)

    // Attach the REST API Controllers associated with the /contact route
    const contactRESTController = new ContactRESTController(dependencies)
    contactRESTController.attach(app)

    // Attach the REST API Controllers associated with the /logs route
    const logsRESTController = new LogsRESTController(dependencies)
    logsRESTController.attach(app)

    // Attach the REST API Controllers associated with the /entry route
    const entryRouter = new EntryRouter(dependencies)
    entryRouter.attach(app)

    const offerRouter = new OfferRouter(dependencies)
    offerRouter.attach(app)

    const orderRouter = new OrderRouter(dependencies)
    orderRouter.attach(app)

    const mnemonicRouter = new MnemonicRouter(dependencies)
    mnemonicRouter.attach(app)

    const p2wdbRouter = new P2WDBRouter(dependencies)
    p2wdbRouter.attach(app)
  }
}

module.exports = RESTControllers
