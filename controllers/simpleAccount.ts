import { getVerifyingPaymaster, getSimpleAccount, getGasFee, printOp, getHttpRpcClient } from "../src"
import { ethers } from "ethers"

const rpcUrl = process.env.RPC_URL
const bundlerUrl = process.env.BUNDLER_URL || "https://public.stackup.sh/api/v1/node/ethereum-sepolia"
const entryPoint = process.env.ENTRY_POINT || "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
const simpleAccountFactory = process.env.SIMPLE_ACCOUNT_FACTORY || "0x9406Cc6185a346906296840746125a0E44976454"
const paymasterUrl = process.env.PAYMASTER_URL || ""
const provider = new ethers.providers.JsonRpcProvider(rpcUrl)

export const simpleAccountCreate = async (req: any, res: any) => {
  try {
    const signingKey = req.body.signingKey
    // create random signing key
    // const signingKey = new ethers.Wallet(ethers.utils.randomBytes(32)).privateKey

    const accountAPI = getSimpleAccount(provider, signingKey, entryPoint, simpleAccountFactory)

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
      paymaster: "",
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
    const paymasterAPI = options.paymaster ? getVerifyingPaymaster(paymasterUrl, entryPoint) : undefined
    const accountAPI = getSimpleAccount(provider, options.signKey, entryPoint, simpleAccountFactory, paymasterAPI)

    const privateKey = process.env.WALLET_POOL as string
    const target = new ethers.Wallet(privateKey, provider).address
    const value = ethers.utils.parseEther("0.0008")
    const op = await accountAPI.createSignedUserOp({
      target,
      value,
      data: "0x",
      ...(await getGasFee(provider)),
    })
    console.log(`Signed UserOperation: ${await printOp(op)}`)

    const client = await getHttpRpcClient(provider, bundlerUrl, entryPoint)
    const uoHash = await client.sendUserOpToBundler(op)
    console.log(`UserOpHash: ${uoHash}`)

    console.log("Waiting for transaction...")
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
    value: ethers.utils.parseEther("0.001"),
  }
  const res = await wallet.sendTransaction(tx)
  return res
}
