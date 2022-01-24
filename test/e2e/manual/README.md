# Manual End-to-End Tests

This directory contains a series of node.js scripts that can be used to test the component parts of the DEX. A trade is composed of three phases:

- 'Make' an Offer, which turns into an Order, which is a partial transaction.
- 'Take' an Order, by completing the transactions and partially signing it.
- 'Accept' an Order, by signing the remaining inputs and outputs and broadcasting the transaction.

Be sure to read the [dev-docs](../../../dev-docs) to understand the difference between an Offer and and Order. The scripts in this directly facilitate the above workflow:

- [create-offer.js](./create-offer.js) is used to create a new Offer. This is then turned into an Order via the webhook from the P2WDB.
- [create-order.js](./create-order.js) is used to simulate the webhook from the P2WDB, which is used to track new Orders.
- [list-offers.js](./list-offers.js) is used to list all the Offers tracked by this instance of the DEX.
- [list-orders.js](./list-orders.js) is used to list all the Orders tracked by this instance of the DEX.
- [take-order.js](./take-order.js) is used to 'take' the other side of an Order.
- [is-offer-taken.js](./is-offer-taken.js) is used to detect any 'taken' Offers tracked by this instance of the DEX.
