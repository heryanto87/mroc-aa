import {
  getVerifyingPaymaster,
  getSimpleAccount,
  getGasFee,
  printOp,
  getHttpRpcClient,
} from '../src'
import { ethers } from 'ethers'

const rpcUrl = process.env.RPC_URL
const bundlerUrl =
  process.env.BUNDLER_URL ||
  'https://app.stackup.sh/api/v1/bundler/0c73bde6b34757eecd80fe35c8a8606c93136d5fca007bae2718f245ff02caef'
const entryPoint =
  process.env.ENTRY_POINT || '0x0f46c65c17aa6b4102046935f33301f0510b163a'
const simpleAccountFactory =
  process.env.SIMPLE_ACCOUNT_FACTORY ||
  '0x6C583EE7f3a80cB53dDc4789B0Af1aaFf90e55F3'
const paymasterUrl = process.env.PAYMASTER_URL || ''
const provider = new ethers.providers.JsonRpcProvider(rpcUrl)

export const simpleAccountCreate = async (req: any, res: any) => {
  try {
    // const signingKey = req.body.signingKey
    // create random signing key
    const signingKey = new ethers.Wallet(ethers.utils.randomBytes(32)).privateKey

    const accountAPI = getSimpleAccount(
      provider,
      signingKey,
      entryPoint,
      simpleAccountFactory
    )

    const address = await accountAPI.getCounterFactualAddress()

    // Topup the account
    const topupRes = await topUpAccount(address)
    console.log(`Topup response: ${topupRes}`)

    // Check balance of the account
    const balance = await provider.getBalance(address)
    console.log(`Balance of the account: ${balance}`)

    // activate account
    const activationTx = await simpleAccountTransfer({
      signKey: signingKey,
      paymaster: '',
    })

    console.log(`Activation transaction: ${activationTx}`)

    return res.status(200).json({
      smartAccount: address,
      success: 1,
    })
  } catch (error) {
    return res.status(500).send(error)
  }
}

async function simpleAccountTransfer(options: any) {
  try {
    const paymasterAPI = options.paymaster
      ? getVerifyingPaymaster(paymasterUrl, entryPoint)
      : undefined
    const accountAPI = getSimpleAccount(
      provider,
      options.signKey,
      entryPoint,
      simpleAccountFactory,
      paymasterAPI
    )

    const privateKey = process.env.WALLET_POOL as string
    const target = new ethers.Wallet(privateKey, provider).address
    const value = ethers.utils.parseEther('0.0008')
    const op = await accountAPI.createSignedUserOp({
      target,
      value,
      data: '0x',
      ...(await getGasFee(provider)),
    })
    console.log(`Signed UserOperation: ${await printOp(op)}`)

    const client = await getHttpRpcClient(provider, bundlerUrl, entryPoint)
    const uoHash = await client.sendUserOpToBundler(op)
    console.log(`UserOpHash: ${uoHash}`)

    console.log('Waiting for transaction...')
    const txHash = await accountAPI.getUserOpReceipt(uoHash)
    console.log(`Transaction hash: ${txHash}`)

    return txHash
  } catch (error) {
    return error
  }
}

async function topUpAccount(address: string) {
  // Create a wallet instance
  const privateKey = process.env.WALLET_POOL as string
  const wallet = new ethers.Wallet(privateKey, provider)
  const tx = {
    to: address,
    value: ethers.utils.parseEther('0.001'),
  }
  const res = await wallet.sendTransaction(tx)
  return res
}
