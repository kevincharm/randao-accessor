import { BigNumber, ethers } from 'ethers'

export interface EthereumJSONRPCBlock {
    hash: string
    parentHash: string
    sha3Uncles: string
    miner: string
    stateRoot: string
    transactionsRoot: string
    receiptsRoot: string
    logsBloom: string
    difficulty: string
    number: string
    gasLimit: string
    gasUsed: string
    timestamp: string
    extraData: string
    mixHash: string
    nonce: string
    baseFeePerGas: string
    withdrawalsRoot: string
}

export async function getBlockWithRLP(hash: string, provider: ethers.providers.JsonRpcProvider) {
    const block: EthereumJSONRPCBlock = await provider.send('eth_getBlockByHash', [hash, false])

    // https://github.com/ethereum/go-ethereum/blob/master/core/types/block.go#L79C7-L79C7
    const blockHeaderRLPList = [
        block.parentHash,
        block.sha3Uncles,
        block.miner,
        block.stateRoot,
        block.transactionsRoot,
        block.receiptsRoot,
        block.logsBloom,
        block.difficulty,
        block.number,
        block.gasLimit,
        block.gasUsed,
        block.timestamp,
        block.extraData,
        block.mixHash,
        block.nonce,
        block.baseFeePerGas /** EIP-1559 */,
        block.withdrawalsRoot /** EIP-4895 */,
        // block.excessDataGas /** EIP-4844 */
        // block.dataGasUsed /** EIP-4844 */
    ].map((bytesLike: string) => {
        if (!bytesLike.toLowerCase().startsWith('0x')) {
            throw new Error(`Not a hex string: ${bytesLike}`)
        }

        bytesLike = String(bytesLike)
        if (
            bytesLike.toLowerCase() === '0' ||
            bytesLike.toLowerCase() === '0x0' ||
            bytesLike.toLowerCase() === '0x00'
        ) {
            // 0 numerical values shall be represented as '0x'
            return '0x'
        } else if (bytesLike.length % 2) {
            // odd
            const evenByteLen = (bytesLike.slice(2).length + 1) / 2
            return ethers.utils.hexZeroPad(bytesLike, evenByteLen)
        } else {
            return bytesLike
        }
    })

    const blockHeaderRLP = ethers.utils.RLP.encode(blockHeaderRLPList)

    return {
        block,
        blockHeaderRLP,
    }
}
