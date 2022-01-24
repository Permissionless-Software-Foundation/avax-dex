/*
  REST API Controller library for the /offer route
*/

// const { wlogger } = require('../../../adapters/wlogger')

let _this

class OfferRESTControllerLib {
  constructor (localConfig = {}) {
    // Dependency Injection.
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of Adapters library required when instantiating /offer REST Controller.'
      )
    }
    this.useCases = localConfig.useCases
    if (!this.useCases) {
      throw new Error(
        'Instance of Use Cases library required when instantiating /offer REST Controller.'
      )
    }

    // Encapsulate dependencies
    this.OfferModel = this.adapters.localdb.Offer
    // this.userUseCases = this.useCases.user

    _this = this
  }

  // No api-doc documentation because this wont be a public endpoint
  async createOffer (ctx) {
    try {
      // console.log('body: ', ctx.request.body)

      const offerObj = ctx.request.body.offer
      const hash = await _this.useCases.offer.createOffer(offerObj)

      ctx.body = { hash }
    } catch (err) {
      // console.log(`err.message: ${err.message}`)
      // console.log('err: ', err)
      // ctx.throw(422, err.message)
      _this.handleError(ctx, err)
    }
  }

  // curl -X GET http://localhost:5700/offer/list
  async listOffers (ctx) {
    try {
      const offers = await _this.useCases.offer.listOffers()

      ctx.body = offers
    } catch (err) {
      console.log('Error in listOffers REST API handler.')
      _this.handleError(ctx, err)
    }
  }

  async checkStatusByOfferHash (ctx) {
    try {
      const p2wdbOfferHash = ctx.request.body.hash
      const order = await _this.useCases.order.checkTakenOrder(p2wdbOfferHash)

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

module.exports = OfferRESTControllerLib
