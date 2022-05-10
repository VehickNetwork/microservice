import axios from 'axios'
import { contractAddress, devnet_apiURL } from './config'

export const getTransactionsHash = async (start_point: string) => {
  let txHashes = []
  try {
    const { data, status } = await axios.get(
      `${devnet_apiURL}/accounts/${contractAddress}/transactions?from=${start_point}&status=success&order=asc&withScResults=true&withLogs=true`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    )
    for (var _i = 0; _i < data.length; _i++) {
      txHashes[_i] = data[_i].txHash
    }
    console.log('response status is: ', status)
    return txHashes
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log('error message:', error.message)
    } else {
      console.log('unexpected error: ', error)
    }
  }
}
