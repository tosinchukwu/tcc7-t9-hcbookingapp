import { ethers } from "ethers";

export const connectWallet = async() => {
    if(!window.ethereum) throw new Error("Metamask is not installed");

    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    return { provider, signer, address};
};