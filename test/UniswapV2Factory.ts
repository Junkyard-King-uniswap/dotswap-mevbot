import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { BigNumber, constants, Contract } from 'ethers'
import { ethers } from 'hardhat'
import { UniswapV2Factory } from '../typechain'
import PairArtifacts from '../artifacts/contracts/UniswapV2Pair.sol/UniswapV2Pair.json'
import { getCreate2Address, keccak256, solidityPack } from 'ethers/lib/utils'

const TEST_ADDRESSES: [string, string] = [
  '0x1000000000000000000000000000000000000000',
  '0x2000000000000000000000000000000000000000',
]

describe('UniswapV2Factory', () => {
  let factory: UniswapV2Factory
  let wallet: SignerWithAddress, other: SignerWithAddress

  beforeEach(async () => {
    ;[wallet, other] = await ethers.getSigners()

    const contractFactory = await ethers.getContractFactory('UniswapV2Factory')
    factory = await contractFactory.deploy(wallet.address)
  })

  it('feeTo, feeToSetter, allPairsLength', async () => {
    expect(await factory.feeTo()).to.eq(constants.AddressZero)
    expect(await factory.feeToSetter()).to.eq(wallet.address)
    expect(await factory.allPairsLength()).to.eq(0)
  })

  async function createPair(tokens: [string, string]) {
    const { bytecode } = await ethers.getContractFactory('UniswapV2Pair')
    const [token0, token1] = tokens.sort()
    const create2Address = getCreate2Address(
      factory.address,
      keccak256(solidityPack(['address', 'address'], [token0, token1])),
      keccak256(bytecode)
    )
    await expect(factory.createPair(...tokens))
      .to.emit(factory, 'PairCreated')
      .withArgs(
        TEST_ADDRESSES[0],
        TEST_ADDRESSES[1],
        create2Address,
        BigNumber.from(1)
      )

    await expect(factory.createPair(...tokens)).to.be.reverted // UniswapV2: PAIR_EXISTS
    const reversed = tokens.slice().reverse()
    await expect(factory.createPair(reversed[0], reversed[1])).to.be.reverted // UniswapV2: PAIR_EXISTS
    expect(await factory.getPair(...tokens)).to.eq(create2Address)
    expect(await factory.getPair(reversed[0], reversed[1])).to.eq(
      create2Address
    )
    expect(await factory.allPairs(0)).to.eq(create2Address)
    expect(await factory.allPairsLength()).to.eq(1)

    const pair = new Contract(
      create2Address,
      JSON.stringify(PairArtifacts.abi),
      wallet
    )
    expect(await pair.factory()).to.eq(factory.address)
    expect(await pair.token0()).to.eq(TEST_ADDRESSES[0])
    expect(await pair.token1()).to.eq(TEST_ADDRESSES[1])
  }

  it('createPair', async () => {
    await createPair(TEST_ADDRESSES)
  })

  it('createPair:reverse', async () => {
    await createPair(TEST_ADDRESSES.slice().reverse() as [string, string])
  })

  it('createPair:gas', async () => {
    const tx = await factory.createPair(...TEST_ADDRESSES)
    const receipt = await tx.wait()
    expect(receipt.gasUsed).to.eq(2029585)
  })

  it('setFeeTo', async () => {
    await expect(
      factory.connect(other).setFeeTo(other.address)
    ).to.be.revertedWith('UniswapV2: FORBIDDEN')
    await factory.setFeeTo(wallet.address)
    expect(await factory.feeTo()).to.eq(wallet.address)
  })

  it('setFeeToSetter', async () => {
    await expect(
      factory.connect(other).setFeeToSetter(other.address)
    ).to.be.revertedWith('UniswapV2: FORBIDDEN')
    await factory.setFeeToSetter(other.address)
    expect(await factory.feeToSetter()).to.eq(other.address)
    await expect(factory.setFeeToSetter(wallet.address)).to.be.revertedWith(
      'UniswapV2: FORBIDDEN'
    )
  })
})
