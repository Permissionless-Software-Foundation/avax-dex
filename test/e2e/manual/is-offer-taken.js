/*
  A manual e2e test for completing the second part of a three-part trade.
  Use the list-orders.js script to list available orders. Use this take-order.js
  script to take the other side of an order.

  Ensure the REST API is up an running before running this test.
*/

const axios = require('axios')

const LOCALHOST = 'http://localhost:5700'

async function start () {
  try {
    const options = {
      method: 'post',
      url: `${LOCALHOST}/offer/is-taken`,
      data: {
        hash: 'zdpuAmf1x9DBb3ymNrBQaQSSBfG7qLrUtR1hxrxvQn372VRLc'
      }
    }

    const result = await axios(options)
    console.log('result.data: ', result.data)
  } catch (err) {
    console.log(err)
  }
}
start()
