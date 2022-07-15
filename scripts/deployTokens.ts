// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ERC20Mintable } from '../typechain'
import {
  deployAndVerify,
  DeployAndVerifyOptions,
  DeployItem,
  DeployResult,
} from './utillities'

interface TokenContractDeployItem {
  name: string
  contract: DeployItem
}

const getERC20ContractDeployInfo = (name: string): TokenContractDeployItem => {
  return {
    name,
    contract: {
      name: 'ERC20Mintable',
      params: [name, name, 18],
    },
  }
}

export async function main() {
  const options: DeployAndVerifyOptions = {
    delayTimer: 10000,
  }
  const tokens: TokenContractDeployItem[] = [
    getERC20ContractDeployInfo('RDA'),
    getERC20ContractDeployInfo('RDB'),
    getERC20ContractDeployInfo('RDC'),
    getERC20ContractDeployInfo('RDD'),
    getERC20ContractDeployInfo('RDE'),
    getERC20ContractDeployInfo('RDF'),
  ]
  const results: DeployResult<ERC20Mintable>[] = []
  for (const { name, contract } of tokens) {
    const result = await deployAndVerify<ERC20Mintable>(contract, options)
    results.push(result)
    console.log(`${name.toUpperCase()} deployed to ${result.address}`)
  }
  return results
}
