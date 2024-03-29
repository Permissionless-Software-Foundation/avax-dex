/*
  REST API Controller library for the /order route
*/

// const { wlogger } = require('../../../adapters/wlogger')

let _this

class OrderRESTControllerLib {
  constructor (localConfig = {}) {
    // Dependency Injection.
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of Adapters library required when instantiating /order REST Controller.'
      )
    }
    this.useCases = localConfig.useCases
    if (!this.useCases) {
      throw new Error(
        'Instance of Use Cases library required when instantiating /order REST Controller.'
      )
    }

    // Encapsulate dependencies
    this.OrderModel = this.adapters.localdb.Order
    // this.userUseCases = this.useCases.user

    _this = this
  }

  // No api-doc documentation because this wont be a public endpoint
  async createOrder (ctx) {
    try {
      // console.log('body: ', ctx.request.body)

      const orderObj = ctx.request.body.order
      const hash = await _this.useCases.order.createOrder(orderObj)

      ctx.body = { hash }
    } catch (err) {
      // console.log(`err.message: ${err.message}`)
      // console.log('err: ', err)
      // ctx.throw(422, err.message)
      _this.handleError(ctx, err)
    }
  }

  // curl -X GET http://localhost:5700/order/list
  async listOrders (ctx) {
    try {
      const orders = await _this.useCases.order.listOrders()

      ctx.body = orders
    } catch (err) {
      console.log('Error in listOrders REST API handler.')
      _this.handleError(ctx, err)
    }
  }

  async checkStatusByOrderHash (ctx) {
    try {
      const p2wdbOrderHash = ctx.request.body.hash
      const order = await _this.useCases.order.checkTakenOrder(p2wdbOrderHash)

      if (!order) {
        ctx.body = {
          order: false
        }
        return
      }

      ctx.body = {
        order
      }
    } catch (error) {
      console.log('Error in checkStatus REST API handler.')
      _this.handleError(ctx, error)
    }
  }

  async acceptOrder (ctx) {
    try {
      console.log('body: ', ctx.request.body)

      const offerHash = ctx.request.body.hash

      // Find the Order.
      const offerEntity = await _this.useCases.offer.findOfferByHash(offerHash)
      console.log('offerEntity: ', offerEntity)

      const orderEntity = await _this.useCases.order.findOrderByHash(offerEntity.offerHash)

      // 'Take' the Order.
      const { txid } = await _this.useCases.offer.completeOffer({
        orderTxHex: orderEntity.txHex,
        hdIndex: orderEntity.hdIndex,
        orderEntity
      })

      ctx.body = { txid }
    } catch (err) {
      console.log('Error in takeOrder REST API handler.')
      _this.handleError(ctx, err)
    }
  }

  // DRY error handler
  handleError (ctx, err) {
    console.log('err', err.message)
    // If an HTTP status is specified by the buisiness logic, use that.
    if (err.status) {
      if (err.message) {
        ctx.throw(err.status, err.message)
      } else {
        ctx.throw(err.status)
      }
    } else {
      // By default use a 422 error if the HTTP status is not specified.
      ctx.throw(422, err.message)
    }
  }
}

module.exports = OrderRESTControllerLib
