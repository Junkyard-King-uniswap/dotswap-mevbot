// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { deployAndVerify, DeployAndVerifyOptions, DeployItem } from './deploy'

interface TokenContractDeployItem {
  name: string
  contract: DeployItem
}

const getERC20Contract = (name: string): TokenContractDeployItem => {
  return {
    name,
    contract: {
      name: 'ERC20Mintable',
      params: [name, name, 18],
    },
  }
}

async function main() {
  const options: DeployAndVerifyOptions = {
    delayTimer: 10000,
  }
  const tokens: TokenContractDeployItem[] = [
    getERC20Contract('RDA'),
    getERC20Contract('RDB'),
    getERC20Contract('RDC'),
    getERC20Contract('RDD'),
    getERC20Contract('RDE'),
    getERC20Contract('RDF'),
  ]
  for (const { name, contract } of tokens) {
    const address = await deployAndVerify(contract, options)
    console.log(`${name.toUpperCase()} deployed to ${address}`)
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
