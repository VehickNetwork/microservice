import { AppDataSource } from './data-source'
import { TransactionDetails } from './entity/TransactionDetails'
import { ApiNetworkProvider } from '@elrondnetwork/erdjs-network-providers'
import { StringValue, TransactionPayload } from '@elrondnetwork/erdjs/out'
import { devnet_apiURL } from './config'
import { getTransactionsHash } from './txIndex'
import * as express from 'express'
import { Request, Response } from 'express'
import helmet from 'helmet'
var compression = require('compression')

const PORT=3001
const REQ_INTERVAL=7500

AppDataSource.initialize()
  .then(async () => {
    async function dataEntries() {
      const entriesIndatabase = await AppDataSource.manager.find(
        TransactionDetails
      )
      const txHashes = await getTransactionsHash(
        entriesIndatabase.length.toString()
      )
      let txArgument = null
      txHashes?.forEach(async (tx, _i) => {
        let networkProvider = new ApiNetworkProvider(devnet_apiURL)
        let txResponse = await networkProvider.getTransaction(tx)
        let txData = new TransactionPayload(
          txResponse.data
        ).getEncodedArguments()
        
        txArgument = StringValue.fromHex(txData[1]).valueOf()
        
        let scResultData = StringValue.fromHex(
          new TransactionPayload(
            txResponse.contractResults.items[0].data
          ).getEncodedArguments()[1]
        ).valueOf()

        console.log('Inserting a new user into the database...')
        const txDetails = new TransactionDetails()
        ;(txDetails.txHash = tx),
          (txDetails.carAddress = txResponse.sender.bech32()),
          (txDetails.action = txData[0]),
          (txDetails.actionValue = txArgument),
          (txDetails.timestamp = txResponse.timestamp),
          (txDetails.scResult = scResultData)

        await AppDataSource.manager.save(txDetails)
        console.log('Saved a new user with id: ' + txDetails.id)
      })
    }

    dataEntries()
    setInterval(dataEntries, REQ_INTERVAL )

    const app = express()
    app.use(express.json())
    app.use(compression())
    app.use(helmet())
    // Route to get all transacitons
    app.get('/api/transactions', async function (req: Request, res: Response) {
      try {
        const transactions = await AppDataSource.getRepository(
          TransactionDetails
        ).find()
        res.send(transactions)
      } catch (err) {
        res.sendStatus(502)
      }
    })

    // Route to get one car via carAddress
    app.get(
      '/api/carAddress/:carAddress',
      async function (req: Request, res: Response) {
        try {
          const carAddress = await AppDataSource.getRepository(
            TransactionDetails
          )
            .createQueryBuilder('vehick')
            .where('vehick.carAddress = :carAddress', {
              carAddress: req.params.carAddress,
            })
            .orderBy('vehick.timestamp', 'DESC')
            .getMany()
          res.send(carAddress)
        } catch (err) {
          res.sendStatus(502)
        }
      }
    )

    // Route to get one car via Vin Number
    app.get('/api/carVin/:Vin', async function (req: Request, res: Response) {
      try {
        const carVin = await AppDataSource.getRepository(TransactionDetails)
          .createQueryBuilder('vehick')
          .select('vehick.carAddress')
          .where('vehick.actionValue = :carVin', { carVin: req.params.Vin })
          .getOne()
        const carAddress = await AppDataSource.getRepository(TransactionDetails)
          .createQueryBuilder('vehick')
          .where('vehick.carAddress = :carAddress', {
            carAddress: carVin.carAddress,
          })
          .orderBy('vehick.timestamp', 'DESC')
          .getMany()
        res.send(carAddress)
      } catch (err) {
        res.sendStatus(502)
      }
    })

    app.get('*', function (req: Request, res: Response) {
      res.sendStatus(404)
    })

    app.listen(PORT, () => {
      console.log(`Example app listening on port ${PORT}`)
    })
  })
  .catch((error) => console.log(error))
