import { constants } from 'ethers'
import { ethers, run } from 'hardhat'

export interface DeployItem {
  name: string
  params: any[]
}

export interface DeployAndVerifyOptions {
  delayTimer?: number
}

export async function deploy(item: DeployItem): Promise<string> {
  try {
    console.log(`[deploy] starting deploy contract ${item.name}`)
    const factory = await ethers.getContractFactory(item.name)
    if (!factory) {
      return constants.AddressZero
    }

    const contract = await factory.deploy.apply(factory, item.params)
    await contract.deployed()
    console.log(
      `[deploy] success deploy contract ${item.name} to ${contract.address}`
    )
    return contract.address
  } catch (error) {
    console.error(
      `[deploy] failed deploy contract ${item.name} [reason: ${error}]`
    )
    return constants.AddressZero
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

export async function deployAndVerify(
  item: DeployItem,
  options?: DeployAndVerifyOptions
): Promise<string> {
  const address = await deploy(item)
  if (address === constants.AddressZero) {
    return address
  }
  options && options.delayTimer && (await delay(options.delayTimer))
  await verify(item, address)
  return address
}

async function delay(time: number) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, time)
  })
}
