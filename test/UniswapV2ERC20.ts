import { expect } from 'chai'
import { UniswapV2ERC20 } from '../typechain'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers } from 'hardhat'
import { hexlify, keccak256, parseUnits, toUtf8Bytes } from 'ethers/lib/utils'
import { BigNumber, constants, Wallet } from 'ethers'
import { getApprovalDigest, getDomainSeparator } from './shared/utillities'
import { ecsign } from 'ethereumjs-util'

const TOTAL_SUPPLY = parseUnits('10000', 18)
const TEST_AMOUNT = parseUnits('10', 18)

describe('UniswapV2ERC20', () => {
  let token: UniswapV2ERC20
  let wallet: Wallet, other: SignerWithAddress
  let chainId: number

  beforeEach(async () => {
    let alice: SignerWithAddress
    ;[other, alice] = await ethers.getSigners()
    wallet = ethers.Wallet.createRandom()
    if (other.provider) {
      wallet = wallet.connect(other.provider)
      const tx = await alice.sendTransaction({
        to: wallet.address,
        value: (await alice.getBalance()).div(2),
      })
      await tx.wait()
    }
    const contractFactory = await ethers.getContractFactory('ERC20')
    token = await contractFactory.connect(wallet).deploy(TOTAL_SUPPLY)
    chainId = await wallet.getChainId()
  })

  it('name, symbol, decimals, totalSupply, balanceOf, DOMAIN_SEPARATOR, PERMIT_TYPEHASH', async () => {
    const name = await token.name()
    expect(name).to.eq('Uniswap V2')
    expect(await token.symbol()).to.eq('UNI-V2')
    expect(await token.decimals()).to.eq(18)
    expect(await token.totalSupply()).to.eq(TOTAL_SUPPLY)
    expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY)
    expect(await token.DOMAIN_SEPARATOR()).to.eq(
      getDomainSeparator(name, token.address, chainId)
    )
    expect(await token.PERMIT_TYPEHASH()).to.eq(
      keccak256(
        toUtf8Bytes(
          'Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)'
        )
      )
    )
  })

  it('approve', async () => {
    await expect(token.approve(other.address, TEST_AMOUNT))
      .to.emit(token, 'Approval')
      .withArgs(wallet.address, other.address, TEST_AMOUNT)
    expect(await token.allowance(wallet.address, other.address)).to.eq(
      TEST_AMOUNT
    )
  })

  it('transfer', async () => {
    await expect(token.transfer(other.address, TEST_AMOUNT))
      .to.emit(token, 'Transfer')
      .withArgs(wallet.address, other.address, TEST_AMOUNT)
    expect(await token.balanceOf(wallet.address)).to.eq(
      TOTAL_SUPPLY.sub(TEST_AMOUNT)
    )
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT)
  })

  it('transfer:fail', async () => {
    await expect(token.transfer(other.address, TOTAL_SUPPLY.add(1))).to.be
      .reverted // ds-math-sub-underflow
    await expect(token.connect(other).transfer(wallet.address, 1)).to.be
      .reverted // ds-math-sub-underflow
  })

  it('transferFrom', async () => {
    await token.approve(other.address, TEST_AMOUNT)
    await expect(
      token
        .connect(other)
        .transferFrom(wallet.address, other.address, TEST_AMOUNT)
    )
      .to.emit(token, 'Transfer')
      .withArgs(wallet.address, other.address, TEST_AMOUNT)
    expect(await token.allowance(wallet.address, other.address)).to.eq(0)
    expect(await token.balanceOf(wallet.address)).to.eq(
      TOTAL_SUPPLY.sub(TEST_AMOUNT)
    )
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT)
  })

  it('transferFrom:max', async () => {
    await token.approve(other.address, constants.MaxUint256)
    await expect(
      token
        .connect(other)
        .transferFrom(wallet.address, other.address, TEST_AMOUNT)
    )
      .to.emit(token, 'Transfer')
      .withArgs(wallet.address, other.address, TEST_AMOUNT)
    expect(await token.allowance(wallet.address, other.address)).to.eq(
      constants.MaxUint256
    )
    expect(await token.balanceOf(wallet.address)).to.eq(
      TOTAL_SUPPLY.sub(TEST_AMOUNT)
    )
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT)
  })

  it('permit', async () => {
    const nonce = await token.nonces(wallet.address)
    const deadline = constants.MaxUint256
    const digest = await getApprovalDigest(
      token,
      { owner: wallet.address, spender: other.address, value: TEST_AMOUNT },
      nonce,
      deadline,
      chainId
    )

    const { v, r, s } = ecsign(
      Buffer.from(digest.slice(2), 'hex'),
      Buffer.from(wallet.privateKey.slice(2), 'hex')
    )
    await expect(
      token.permit(
        wallet.address,
        other.address,
        TEST_AMOUNT,
        deadline,
        v,
        hexlify(r),
        hexlify(s)
      )
    )
      .to.emit(token, 'Approval')
      .withArgs(wallet.address, other.address, TEST_AMOUNT)
    expect(await token.allowance(wallet.address, other.address)).to.eq(
      TEST_AMOUNT
    )
    expect(await token.nonces(wallet.address)).to.eq(BigNumber.from(1))
  })
})
