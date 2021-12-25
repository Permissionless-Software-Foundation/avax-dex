/*
  A manual e2e test for creating an swap offer.

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
      tokenId: '2tEi6r6PZ9VXHogUmkCzvijmW81TRNjtKWnR4FA55zTPc87fxC',
      buyOrSell: 'sell',
      rateInSats: 1000,
      minSatsToExchange: 10,
      numTokens: 3
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
