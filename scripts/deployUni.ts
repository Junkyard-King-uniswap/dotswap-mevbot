// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from 'hardhat'
import { UniswapV2Factory, UniswapV2Router02, WETH9 } from '../typechain'
import { deployAndVerify, DeployAndVerifyOptions } from './utillities'

export async function main() {
  const options: DeployAndVerifyOptions = {
    delayTimer: 10000,
  }
  // deploy weth
  const weth = await deployAndVerify<WETH9>(
    {
      name: 'WETH9',
      params: [],
    },
    options
  )
  // deploy factory
  const [signer] = await ethers.getSigners()
  const factory = await deployAndVerify<UniswapV2Factory>(
    {
      name: 'UniswapV2Factory',
      params: [signer.address],
    },
    options
  )
  // deploy routerv2
  const router = await deployAndVerify<UniswapV2Router02>(
    {
      name: 'UniswapV2Router02',
      params: [factory.address, weth.address],
    },
    options
  )
  return {
    weth,
    factory,
    router,
  }
}
