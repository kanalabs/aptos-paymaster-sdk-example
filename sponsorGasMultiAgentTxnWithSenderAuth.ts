import 'dotenv/config';
import { Account, AccountAddress, Network, parseTypeTag, U64 } from '@aptos-labs/ts-sdk';
import { PaymasterSdk } from '@kanalabs/paymaster-sdk';

const test = async () => {
    try {
      const testProjectKey = process.env.PROJECT_KEY as string
  
      const senderAccount = Account.generate()
      const additionalAccount = Account.generate()
      const APTOS_COIN = '0x1::aptos_coin::AptosCoin'
  
      const CREATE_OBJECT_SCRIPT =
        '0xa11ceb0b060000000601000402040403080a051209071b3608512000000001000302000102000200000402030001060c000105010800066f626a656374067369676e65720a616464726573735f6f660e436f6e7374727563746f725265660d6372656174655f6f626a6563740000000000000000000000000000000000000000000000000000000000000001000001050b00110011010102'
      const TRANSFER_SCRIPT =
        '0xa11ceb0b060000000701000602060a031017042706052d2d075a4b08a5012000000001000201030701000101040800020503040000060602010001070408010801060902010801050207030704060c060c0503010b000108010001060c010501090003060c0503010801010b0001090003060c0b000109000504636f696e066f626a656374067369676e6572064f626a6563740a4f626a656374436f72650a616464726573735f6f66087472616e7366657211616464726573735f746f5f6f626a6563740000000000000000000000000000000000000000000000000000000000000001010000010e0a010a0011000b0338000b0238010c040b000b040b011100380202'
  
      const sdk = new PaymasterSdk(
        { privateKey: undefined },
        {
          projectKey: testProjectKey,
          network: Network.TESTNET,
        },
      )
  
      console.log(
        await sdk.addToWhitelist({
          address: senderAccount.accountAddress.toString(),
        }),
      )
      console.log(
        await sdk.addToWhitelist({
          address: additionalAccount.accountAddress.toString(),
        }),
      )
      console.log(
        await sdk.initAccount({
          address: senderAccount.accountAddress.toString(),
        }),
      )
  
      const createObject = await sdk.aptosClient.transaction.build.simple({
        sender: senderAccount.accountAddress,
        data: {
          bytecode: CREATE_OBJECT_SCRIPT,
          functionArguments: [],
        },
        withFeePayer: true,
      })
      const senderAuthObject = sdk.aptosClient.transaction.sign({
        signer: senderAccount,
        transaction: createObject,
      })
  
      const responseObject: any = await sdk.sponsoredTxnWithSenderAuth({
        senderAuth: senderAuthObject,
        transaction: createObject,
      })
      const txnreceiptObject = (await sdk.aptosClient.waitForTransaction({
        transactionHash: responseObject.hash,
        options: { checkSuccess: true },
      }))

      console.log(
        await sdk.initAccount({
          address: additionalAccount.accountAddress.toString(),
        }),
      )
  
      const objects = await sdk.aptosClient.getAccountOwnedObjects({
        accountAddress: senderAccount.accountAddress,
        minimumLedgerVersion: BigInt(txnreceiptObject.version),
      })
      const objectAddress = objects[0].object_address
  
      console.log(`Created object ${objectAddress} with transaction: ${responseObject.hash}`)
  
      // multiAgent transaction
  
      const transferTxn = await sdk.aptosClient.transaction.build.multiAgent({
        sender: senderAccount.accountAddress,
        secondarySignerAddresses: [additionalAccount.accountAddress],
        data: {
          bytecode: TRANSFER_SCRIPT,
          typeArguments: [parseTypeTag(APTOS_COIN)],
          functionArguments: [AccountAddress.fromString(objectAddress), new U64(0)],
        },
        withFeePayer: true,
      })
  
      const senderAuth = sdk.aptosClient.transaction.sign({
        signer: senderAccount,
        transaction: transferTxn,
      })
  
      const additionalAuth = sdk.aptosClient.sign({
        signer: additionalAccount,
        transaction: transferTxn,
      })
  
      const response = await sdk.sponsoredTxnWithSenderAuth({
        senderAuth: senderAuth,
        transaction: transferTxn,
        additionalAuthenticators: [additionalAuth],
        additionalAddresses: [additionalAccount.accountAddress],
      })
      if ('hash' in response) {
        const txnreceipt = (await sdk.aptosClient.waitForTransaction({
          transactionHash: response.hash,
          options: { checkSuccess: true },
        }))
        console.log('txn status', txnreceipt.success)
      }
    } catch (error: any) {
      console.log('error', error)
    }
  }
  
  test()