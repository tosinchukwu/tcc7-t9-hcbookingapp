## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Ensure you are in Contracts folder to Install Foundry dependencies if not 

```
cd contracts
```
then
```
forge install OpenZeppelin/openzeppelin-contracts
```
Set up environment variables – copy .env.example to .env.local and fill in the values

⛓️ Smart Contract (Foundry)
The contract is at contracts/src/HealthConsultationBooking.sol

To compile the contract
```
forge build
```

To Test
```
forge test
```

Deploy to Sepolia Blockchain
```
forge script script/DeployHealthConsultationBooking.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```
  
After deployment, copy the contract address and update NEXT_PUBLIC_CONTRACT_ADDRESS.

Copy the ABI
from contracts/out/HealthConsultationBooking.sol/HealthConsultationBooking.json to abis/ folder of thr project
