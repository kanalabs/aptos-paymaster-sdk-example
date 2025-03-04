import {
    Account,
    Aptos,
    AptosConfig,
    Network,
    PendingTransactionResponse,
    UserTransactionResponse,
  } from '@aptos-labs/ts-sdk'
import { PaymasterSdk, TransactionOptions, TransactionPayload } from '@kanalabs/paymaster-sdk'
  import 'dotenv/config'
  
  const test = async () => {
    try {
      const testProjectKey = process.env.PROJECT_KEY as string
  
      const config = new AptosConfig({ network: Network.MAINNET })
      const aptosClient = new Aptos(config)
      const senderAccount = Account.generate()
  
      const payload: TransactionPayload = {
        function: '0x1::aptos_account::transfer_coins',
        functionArguments: ['0x0b4b8ef78fb296f89006f1936f01427a3a7e0eadd11dd4998c6bf438a0c8ce6b', 0],
        typeArguments: ['0x1::aptos_coin::AptosCoin'],
      }
  
      const options: TransactionOptions = {
        gasUnitPrice: 100,
        maxGasAmount: 2000,
      }
  
      const sdk = new PaymasterSdk(
        { privateKey: undefined },
        {
          projectKey: testProjectKey,
          network: Network.MAINNET,
        },
      )
  
      const isWhitelisted = await sdk.isWhitelisted({
        address: senderAccount.accountAddress.toString(),
      })
  
      if (!(isWhitelisted.message == 'whitelisted')) {
        console.log('not whitelisted')
        console.log(
          await sdk.addToWhitelist({
            address: senderAccount.accountAddress.toString(),
          }),
        )
      }
      console.log(
        await sdk.initAccount({
          address: senderAccount.accountAddress.toString(),
        }),
      )
  
      const transaction = await aptosClient.transaction.build.simple({
        sender: senderAccount.accountAddress.toString(),
        data: payload,
        options: options,
        withFeePayer: true,
      })
      const senderAuth = sdk.aptosClient.transaction.sign({
        signer: senderAccount,
        transaction: transaction,
      })
  
      const response = await sdk.sponsoredTxnWithSenderAuth({
        senderAuth: senderAuth,
        transaction: transaction,
      })
      if ((response as PendingTransactionResponse).hash) {
        const txnreceipt = (await sdk.aptosClient.waitForTransaction({
          transactionHash: (response as PendingTransactionResponse).hash,
          options: { checkSuccess: true },
        })) as UserTransactionResponse
        console.log('txn status', txnreceipt.success)
      }
    } catch (error: any) {
      console.log('error', error)
    }
  }
  
  test()
  