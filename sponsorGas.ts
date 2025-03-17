import 'dotenv/config';
import { Account, Network, PendingTransactionResponse, TransactionPayload } from '@aptos-labs/ts-sdk';
import { PaymasterSdk, TransactionOptions } from '@kanalabs/paymaster-sdk';
(async () => {
  const testProjectKey = process.env.PROJECT_KEY as string
  // const testPrivateKey = process.env.PRIVATE_KEY as string
  const account = Account.generate()
  const key = account.privateKey.toString()
  const sdk = new PaymasterSdk({ privateKey: key }, { projectKey: testProjectKey, network: Network.TESTNET })
  const payload: any = {
    function: '0x1::aptos_account::transfer_coins',
    functionArguments: ['0x0b4b8ef78fb296f89006f1936f01427a3a7e0eadd11dd4998c6bf438a0c8ce6b', 0],
    typeArguments: ['0x1::aptos_coin::AptosCoin'],
  }
  const options: TransactionOptions = { gasUnitPrice: 100, maxGasAmount: 1000 }
  console.log(await sdk.addToWhitelist())
  console.log(await sdk.initAccount())
  const txn = await sdk.sponsoredTxn({
    data: payload,
    options: options,
  })
  if ((txn as PendingTransactionResponse).hash) {
    const txnReceipt = await sdk.aptosClient.waitForTransaction({
      transactionHash: (txn as PendingTransactionResponse).hash,
      options: {
        checkSuccess: true,
      },
    })
    console.log(txnReceipt.success)
  }
})()
