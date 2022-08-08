/*
  A manual e2e test for completing the second part of a three-part trade.
  Use the list-offers.js script to list available offers. Use this take-offer.js
  script to take issue a Counter-Offer to take the other side of an Offer.

  Ensure the REST API is up an running before running this test.
*/

const axios = require('axios')

const LOCALHOST = 'http://localhost:5700'

async function start () {
  try {
    const options = {
      method: 'post',
      url: `${LOCALHOST}/offer/take`,
      data: {
        // orderId: '62effc01365c7049432948ee'
        offerP2wdbId: 'zdpuB1ZYFKmZPR1FhVFkY8usBMfuqstkKnpDDT8n4uVzXqmVe'
      }
    }

    const result = await axios(options)
    console.log('result.data: ', result.data)
  } catch (err) {
    console.log(err)
  }
}
start()
