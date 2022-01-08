/*
  A manual e2e test for creating a swap offer.

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
      tokenId: '2aK8oMc5izZbmSsBiNzb6kPNjXeiQGPLUy1sFqoF3d9QEzi9si',
      buyOrSell: 'sell',
      rateInSats: 1000,
      minSatsToExchange: 10,
      numTokens: 1
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
