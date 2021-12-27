/*
  Use Case library for Orders.
  Orders are created by a webhook trigger from the P2WDB. Orders are a result of
  new data in P2WDB. They differ from Offers, which are generated by a local
  user.
  An Order is created to match a local Offer, but it's created indirectly, as
  a response to the webhook from the P2WDB. In this way, Orders generated from
  local Offers are no different than Orders generated by other peers.
*/

const OrderEntity = require("../../entities/order");

class OrderUseCases {
  constructor(localConfig = {}) {
    // console.log('User localConfig: ', localConfig)
    this.adapters = localConfig.adapters;
    if (!this.adapters) {
      throw new Error(
        "Instance of adapters must be passed in when instantiating Order Use Cases library."
      );
    }

    this.orderEntity = new OrderEntity();
    this.OrderModel = this.adapters.localdb.Order;
  }

  // This method is called by the POST /order REST API controller, which is
  // triggered by a P2WDB webhook.
  // TODO: 12/27 this function expects BCH data. it needs to be refactored to
  // work with AVAX
  async createOrder(orderObj) {
    try {
      console.log("Use Case createOrder(orderObj): ", orderObj);

      // console.log('this.adapters.bchjs: ', this.adapters.bchjs)

      // Verify that UTXO in order is unspent. If it is spent, then ignore the
      // order.
      const txid = orderObj.data.utxoTxid;
      const vout = orderObj.data.utxoVout;
      const utxoStatus = await this.adapters.bchjs.Blockchain.getTxOut(
        txid,
        vout
      );
      console.log("utxoStatus: ", utxoStatus);
      if (utxoStatus === null) return false;

      const orderEntity = this.orderEntity.validate(orderObj);
      console.log("orderEntity: ", orderEntity);

      // Add order to the local database.
      const orderModel = new this.OrderModel(orderEntity);
      await orderModel.save();

      return true;
    } catch (err) {
      console.error("Error in use-cases/order/createOrder()");
      throw err;
    }
  }
}

module.exports = OrderUseCases;
