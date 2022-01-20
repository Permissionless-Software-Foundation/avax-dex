/*
  A manual e2e test for creating a swap offer.

  Ensure the REST API is up an running before running this test.
*/

const axios = require('axios')

const LOCALHOST = 'http://localhost:5700'

async function start () {
  try {
    const mockOffer = {
      appId: 'swapTest555',
      data: {
        messageType: 1,
        messageClass: 1,
        tokenId: '2tEi6r6PZ9VXHogUmkCzvijmW81TRNjtKWnR4FA55zTPc87fxC',
        buyOrSell: 'sell',
        rateInSats: 1000,
        minSatsToExchange: 10,
        numTokens: 1,
        utxoTxid: 'BkKisuEF3dM6ftMJb44G9U4B8UMxr3jxz1CZhdMrTfWtZWv4i',
        utxoVout: 1,
        txHex: '00000001ed5f38341e436e5d46e2bb00b45d62ae97d1b050c64bc634ae10626739e35c4b0000000121e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a87dff0000000700000000000003e8000000000000000000000001000000012a911a32b2dcfa390b020b406131df356b84a2a1000000011866fa083333eb3c699ff465aafbeb22026061d69ae149c262b1df9f70da48d300000001f808d594b0360d20f7b4214bdb51a773d0f5eb34c5157eea285fefa5a86f5e16000000050000000000000064000000010000000000000000',
        addrReferences: '{"BkKisuEF3dM6ftMJb44G9U4B8UMxr3jxz1CZhdMrTfWqwEugt":"X-avax1r6azu6cegjevcqr070wy4zhvvxkp0x79mmhpwk"}',
        hdIndex: 3
      },
      timestamp: '2022-01-18T05:43:57.471Z',
      localTimeStamp: '1/18/2022, 1:43:57 AM',
      txid: '9d72dd8b44ae992e17b8234843158528b12d81b1f7795521d7e3d164b6ea8f14',
      hash: 'zdpuAwtg2JUHFGS5nr5NztM2LXDteTPPHUBxiEJiLHyRdHUnN'
    }

    const options = {
      method: 'post',
      url: `${LOCALHOST}/order`,
      data: mockOffer
    }

    const result = await axios(options)
    console.log('result.data: ', result.data)
  } catch (err) {
    console.log(err)
  }
}
start()
