import { ethers } from 'ethers'

export const randomKey = async (req: any, res: any) => {
  try {
    const privateKey = new ethers.Wallet(ethers.utils.randomBytes(32)).privateKey
    return res.status(200).send(`Private Key: ${privateKey}`)
  } catch (error) {
    return res.status(500).send(`Error: ${error}`)
  }
}