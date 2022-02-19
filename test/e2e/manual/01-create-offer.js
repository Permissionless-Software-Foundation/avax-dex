/*
  A manual e2e test for creating a swap offer. This script 'makes' an offer,
  and starts off the first part of a three-part trade.

  This script will register the Offer with the P2WDB, which will generate a
  webhook, which will convert the Offer into an Order.

  Ensure the REST API is up an running before running this test.
*/

const axios = require('axios')

const LOCALHOST = 'http://localhost:5700'

async function start () {
  try {
    const mockOffer = {
      lokadId: 'SWP',
      messageType: 1,
      messageClass: 1,
      tokenId: '2jgTFB6MM4vwLzUNWFYGPfyeQfpLaEqj4XWku6FoW7vaGrrEd5',
      buyOrSell: 'sell',
      rateInSats: 3000000,
      minSatsToExchange: 10,
      numTokens: 1.7
    }

    const options = {
      method: 'post',
      url: `${LOCALHOST}/offer`,
      data: { offer: mockOffer }
    }

    const result = await axios(options)
    console.log('result.data: ', result.data)
  } catch (err) {
    console.log(err)
  }
}
start()
