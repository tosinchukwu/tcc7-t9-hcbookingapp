import { ethers } from "ethers";
import ProofStorageABI from "../contracts/out/ProofStorage.sol/ProofStorage.json";

export const getProofContract = async() => {
    if(typeof window === "undefined") {
        throw new Error("Must be used in browser");
    }
    if(!window.ethereum) {
        throw new Error("MetaMask is not installed");
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const contractAddress = process.env.NEXT_PUBLIC_PROOF_ADDRESS;
    if(!contractAddress) {
        throw new Error("Contract address not set in .env");
    }
    return new ethers. Contract (contractAddress, ProofStorageABI.abi, signer);
};