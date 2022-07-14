// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from 'hardhat'
import { deployAndVerify, DeployAndVerifyOptions } from './deploy'

async function main() {
  const options: DeployAndVerifyOptions = {
    delayTimer: 10000,
  }
  // deploy weth
  const wethAddress = await deployAndVerify(
    {
      name: 'WETH9',
      params: [],
    },
    options
  )
  // deploy factory
  const [signer] = await ethers.getSigners()
  const factoryAddress = await deployAndVerify(
    {
      name: 'UniswapV2Factory',
      params: [signer.address],
    },
    options
  )
  // deploy routerv2
  const routerAddress = await deployAndVerify(
    {
      name: 'UniswapV2Router02',
      params: [factoryAddress, wethAddress],
    },
    options
  )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
