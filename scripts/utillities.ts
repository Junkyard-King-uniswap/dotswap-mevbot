import { constants, Contract, ContractFactory } from 'ethers'
import { ethers, run } from 'hardhat'

export interface DeployItem {
  name: string
  params: any[]
}

export interface DeployAndVerifyOptions {
  delayTimer?: number
}

export interface DeployResult<T> {
  address: string
  contract?: T
}

export async function deploy<T extends Contract>(
  item: DeployItem
): Promise<DeployResult<T>> {
  try {
    console.log(`[deploy] starting deploy contract ${item.name}`)
    const factory = await ethers.getContractFactory(item.name)
    if (!factory) {
      return {
        address: constants.AddressZero,
      }
    }

    const contract = await factory.deploy.apply(factory, item.params)
    await contract.deployed()
    console.log(
      `[deploy] success deploy contract ${item.name} to ${contract.address}`
    )
    return {
      address: contract.address,
      contract: contract as T,
    }
  } catch (error) {
    console.error(
      `[deploy] failed deploy contract ${item.name} [reason: ${error}]`
    )
    return {
      address: constants.AddressZero,
    }
  }
}

export async function verify(item: DeployItem, address: string) {
  try {
    console.log(`[verify] starting verify contract ${item.name}`)
    await run('verify:verify', {
      address: address,
      constructorArguments: item.params,
    })
    console.log(`[verify] success verify contract ${item.name}:${address}`)
  } catch (error) {
    console.error(
      `[verify] failed verify contract ${item.name}:${address} [reason: ${error}]`
    )
  }
}

export async function deployAndVerify<T extends Contract>(
  item: DeployItem,
  options?: DeployAndVerifyOptions
): Promise<DeployResult<T>> {
  const result = await deploy<T>(item)
  if (result.address === constants.AddressZero) {
    return result
  }
  options && options.delayTimer && (await delay(options.delayTimer))
  await verify(item, result.address)
  return result
}

async function delay(time: number) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, time)
  })
}
