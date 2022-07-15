import { main as deployUni } from './deployUni'
import { main as deployTokens } from './deployTokens'
import { constants } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { ethers } from 'hardhat'

async function main() {
  // deploy uni contracts
  const { weth, factory, router } = await deployUni()
  // deploy token contracts
  const tokens = await deployTokens()
  const [signer] = await ethers.getSigners()
  for (let token of tokens) {
    try {
      // mint for creator
      if (token.address === constants.AddressZero || !token.contract) {
        continue
      }
      const value = '100000'
      await token.contract.mint(parseUnits(value, 18))
      const tokenName = await token.contract.name()
      console.log(`[mint] mint ${value}${tokenName} for ${signer.address}`)
      // approve for router
      await token.contract.approve(router.address, constants.MaxUint256)
      console.log(
        `[approve] approved max for ${signer.address} to spend your ${tokenName}`
      )
    } catch (error) {
      console.error(`${token.address} process failed [reason: ${error}]`)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
