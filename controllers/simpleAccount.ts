import { getVerifyingPaymaster, getSimpleAccount, getGasFee, printOp, getHttpRpcClient } from '../src'
import { ethers } from 'ethers'
// @ts-ignore
import config from '../config.json'

export const simpleAccountCreate = async (req: any, res: any) => {
	try {
		const rpcUrl = config.rpcUrl
		const signingKey = req.body.signingKey
		const entryPoint = config.entryPoint
		const simpleAccountFactory = config.simpleAccountFactory

		const provider = new ethers.providers.JsonRpcProvider(rpcUrl)

		const accountAPI = getSimpleAccount(provider, signingKey, entryPoint, simpleAccountFactory)

		const address = await accountAPI.getCounterFactualAddress()
		return res.status(200).send(`Simple Account Address: ${address}`)
	} catch (error) {
		return res.status(500).send(`Error: ${error}`)
	}
}

export const simpleAccountTransfer = async (req: any, res: any) => {
	try {
		const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
		const paymasterAPI = req.body.paymaster ? getVerifyingPaymaster(config.paymasterUrl, config.entryPoint) : undefined
		const accountAPI = getSimpleAccount(
			provider,
			req.body.signKey,
			config.entryPoint,
			config.simpleAccountFactory,
			paymasterAPI
		)

		const target = ethers.utils.getAddress(req.body.target)
		const value = ethers.utils.parseEther(req.body.amount)
		const op = await accountAPI.createSignedUserOp({
			target,
			value,
			data: '0x',
			...(await getGasFee(provider)),
		})
		console.log(`Signed UserOperation: ${await printOp(op)}`)

		const client = await getHttpRpcClient(provider, config.bundlerUrl, config.entryPoint)
		const uoHash = await client.sendUserOpToBundler(op)
		console.log(`UserOpHash: ${uoHash}`)

		console.log('Waiting for transaction...')
		const txHash = await accountAPI.getUserOpReceipt(uoHash)
		console.log(`Transaction hash: ${txHash}`)

		return res.status(200).send(`Transfer Succeeded: ${txHash}`)
	} catch (error) {
		return res.status(500).send(`Error: ${error}`)
	}
}
