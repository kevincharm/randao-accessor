import { Axiom } from '@axiom-crypto/core'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { mine } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { RandaoAccessor, RandaoAccessor__factory } from '../typechain-types'
import { getBlockWithRLP } from './utils/rlp'

describe('RandaoAccessor', () => {
    let deployer: SignerWithAddress
    let axiom: Axiom
    let randaoAccessor: RandaoAccessor
    beforeEach(async () => {
        ;[deployer] = await ethers.getSigners()

        axiom = new Axiom({
            chainId: 1,
            providerUri: process.env.MAINNET_URL as string,
            version: 'v1',
        })
        const axiomAddress = axiom.getAxiomAddress()
        expect(Boolean(axiomAddress)).to.eq(true)

        randaoAccessor = await new RandaoAccessor__factory(deployer).deploy(axiomAddress!)
        await mine()
    })

    it('should verify recent randao: boundary', async () => {
        const blockNum = (await ethers.provider.getBlockNumber()) - 256

        const { hash } = await ethers.provider.getBlock(blockNum)
        const { block, blockHeaderRLP } = await getBlockWithRLP(hash, ethers.provider)
        expect(await randaoAccessor.verifyRecent(blockHeaderRLP)).to.eq(block.mixHash)
    })

    it('should verify recent randao: boundary', async () => {
        const blockNum = await ethers.provider.getBlockNumber()

        const { hash } = await ethers.provider.getBlock(blockNum)
        const { block, blockHeaderRLP } = await getBlockWithRLP(hash, ethers.provider)
        await expect(randaoAccessor.verifyRecent(blockHeaderRLP)).to.be.revertedWith(
            'Target block must be older than current'
        )
    })

    it('should verify recent randao', async () => {
        const blockNum = (await ethers.provider.getBlockNumber()) - 127

        const { hash } = await ethers.provider.getBlock(blockNum)
        const { block, blockHeaderRLP } = await getBlockWithRLP(hash, ethers.provider)
        expect(await randaoAccessor.verifyRecent(blockHeaderRLP)).to.eq(block.mixHash)
    })

    it('should fail to verify recent randao', async () => {
        const blockNum = (await ethers.provider.getBlockNumber()) - 257

        const { hash } = await ethers.provider.getBlock(blockNum)
        const { blockHeaderRLP } = await getBlockWithRLP(hash, ethers.provider)
        await expect(randaoAccessor.verifyRecent(blockHeaderRLP)).to.revertedWith('Block too old')
    })

    it('should verify historical randao', async () => {
        const blockNum = 17699001
        // sanity: make sure this is older than 256 blocks
        expect(blockNum < (await ethers.provider.getBlockNumber()) - 256).to.eq(true)

        const blockHashWitness = await axiom.block.getBlockHashWitness(blockNum)
        expect(Boolean(blockHashWitness)).to.eq(true)

        const axiomV1 = new ethers.Contract(axiom.getAxiomAddress()!, axiom.getAxiomAbi(), deployer)
        expect(await axiomV1.isBlockHashValid(blockHashWitness)).to.eq(true)

        const { block, blockHeaderRLP } = await getBlockWithRLP(
            blockHashWitness!.claimedBlockHash,
            ethers.provider
        )
        expect(block.hash).to.eq(blockHashWitness!.claimedBlockHash)
        expect(ethers.utils.solidityKeccak256(['bytes'], [blockHeaderRLP])).to.eq(
            blockHashWitness!.claimedBlockHash
        )

        expect(await randaoAccessor.verifyHistorical(blockHeaderRLP, blockHashWitness!)).to.eq(
            block.mixHash
        )
    })

    it('should fail to verify historical randao: wrong witness', async () => {
        const blockNum = 17699001
        // sanity: make sure this is older than 256 blocks
        expect(blockNum < (await ethers.provider.getBlockNumber()) - 256).to.eq(true)

        const blockHashWitness = await axiom.block.getBlockHashWitness(blockNum + 1)
        expect(Boolean(blockHashWitness)).to.eq(true)

        const axiomV1 = new ethers.Contract(axiom.getAxiomAddress()!, axiom.getAxiomAbi(), deployer)
        expect(await axiomV1.isBlockHashValid(blockHashWitness)).to.eq(true)

        const { hash } = await ethers.provider.getBlock(blockNum)
        const { block, blockHeaderRLP } = await getBlockWithRLP(hash, ethers.provider)
        expect(block.hash).to.not.eq(blockHashWitness!.claimedBlockHash)
        expect(ethers.utils.solidityKeccak256(['bytes'], [blockHeaderRLP])).to.not.eq(
            blockHashWitness!.claimedBlockHash
        )

        await expect(
            randaoAccessor.verifyHistorical(blockHeaderRLP, blockHashWitness!)
        ).to.be.revertedWith('RLP does not match blockhash')
    })
})
