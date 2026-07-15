//SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

contract ProofStorage {
    mapping(bytes32 => bool) public proofs;

    function storeProof(bytes32 hash) external {
        proofs[hash] = true;
    }
    function verifyProof(bytes32 hash) external view returns (bool) {
        return proofs[hash];
    }
}