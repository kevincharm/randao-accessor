// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {IAxiomV1} from "../axiom-v1-contracts/contracts/interfaces/IAxiomV1.sol";
import {RLPReader} from "./utils/RLPReader.sol";

/// @title RandaoAccessor
/// @author kevincharm
/// @notice Verify historical randao values using the Axiom blockhash cache
contract RandaoAccessor {
    using RLPReader for bytes;
    using RLPReader for RLPReader.RLPItem;

    /// @notice Axiom V1 (proxy)
    address public immutable axiomV1;

    constructor(address axiomV1_) {
        axiomV1 = axiomV1_;
    }

    /// @notice Returns true if `blockNum` is within 256 blocks of current
    /// @param blockNum Block number to check
    function isRecentBlock(uint256 blockNum) internal view returns (bool) {
        return (blockNum >= (block.number - 256)) && (blockNum < block.number);
    }

    /// @notice Verify a recent block header and return the prevrandao value
    /// @param blockHeaderRLP RLP-encoded block header
    /// @return Verified prevrandao
    function verifyRecent(
        bytes calldata blockHeaderRLP
    ) public view returns (uint256) {
        RLPReader.RLPItem[] memory blockHeader = blockHeaderRLP.readList();
        uint256 targetBlockNum = blockHeader[8].readUint256();
        require(
            targetBlockNum < block.number,
            "Target block must be older than current"
        );
        require(isRecentBlock(targetBlockNum), "Block too old");
        bytes32 targetBlockHash = blockhash(targetBlockNum);
        require(
            targetBlockHash == keccak256(blockHeaderRLP),
            "RLP does not match blockhash"
        );
        uint256 randao = blockHeader[13].readUint256();
        return randao;
    }

    /// @notice Verify an old block header and return the prevrandao value
    /// @param blockHeaderRLP RLP-encoded block header
    /// @param witness Witness data required for verification against AxiomV1
    /// @return Verified prevrandao
    function verifyHistorical(
        bytes calldata blockHeaderRLP,
        IAxiomV1.BlockHashWitness calldata witness
    ) public view returns (uint256) {
        if (isRecentBlock(witness.blockNumber)) {
            return verifyRecent(blockHeaderRLP);
        }

        require(
            IAxiomV1(axiomV1).isBlockHashValid(witness),
            "Invalid blockhash witness"
        );
        require(
            witness.claimedBlockHash == keccak256(blockHeaderRLP),
            "RLP does not match blockhash"
        );
        RLPReader.RLPItem[] memory blockHeader = blockHeaderRLP.readList();
        uint256 randao = blockHeader[13].readUint256();
        return randao;
    }
}
