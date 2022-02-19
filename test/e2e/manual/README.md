# Manual End-to-End Tests

This directory contains a series of node.js scripts that can be used to test the component parts of the DEX. A trade is composed of three phases:

- 'Make' an Offer, which turns into an Order, which is a partial transaction.
- 'Take' an Order, by completing the transactions and partially signing it.
- 'Accept' an Order, by signing the remaining inputs and outputs and broadcasting the transaction.

Be sure to read the [dev-docs](../../../dev-docs) to understand the difference between an Offer and and Order. The scripts in this directly facilitate the above workflow, in the following order:

- [create-offer.js](./01-create-offer.js) is used to create a new Offer. This is then turned into an Order via the webhook from the P2WDB. In the file the tokenId, numTokens, and rateInSats can be edited for testing with your own tokens. The requries returns the hash that represents the offer in the P2WDB. Should be run as the Seller.
- [take-order.js](./02-take-order.js) is used to 'take' the other side of an Order. This request requires a valid orderId from a 'posted' order. returns the hash that represents the taken order in the P2WDB. Should be run as the buyer
- [accept-offer.js](./03-accept-offer.js) is used to accept the order, signing and broadcasting it to the network. It requires a taken order hash, and returns the txid in the XChain and the hash that represents the accepted order in the P2WDB. Should be run as the Seller.

(optional)
- [create-order.js](./create-order.js) is used to simulate the webhook from the P2WDB, which is used to track new Orders. This method gets executed automatically by the p2wdb under normal circumstances

There are also these scripts that make request to the helper endpoints used for getting extra information on the orders and the offers

- [is-offer-taken.js](./is-offer-taken.js) is used to detect if an offer with a given hash tracked by this instance of the DEX has been taken by a buyer 
- [list-offers.js](./list-offers.js) is used to list all the Offers tracked by this instance of the DEX.
- [list-orders.js](./list-orders.js) is used to list all the Orders tracked by this instance of the DEX.
