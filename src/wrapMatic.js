// local testing of functions 
import {ethers} from 'ethers';
import wmaticABI from './wmaticABI.json' assert { type: 'json' };
import privateKey from '../ignore.json' assert { type: 'json' };

const wmaticAddress = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';

// polygon: https://polygon-rpc.com
const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");
const pk = privateKey[0].pk;

const wallet = new ethers.Wallet(pk, provider);
const contract = new ethers.Contract(wmaticAddress, wmaticABI, wallet);

async function wrapMATIC(amount, maxGas, nonce) {
    const amountInWei = ethers.parseUnits(amount.toString(), 'ether');

    // Set the base and priority fees for EIP-1559
    const maxPriorityFeePerGas = ethers.parseUnits("100", "gwei"); 
    const maxFeePerGas = ethers.parseUnits(maxGas, "gwei"); 
    try {
        const txResponse = await contract.deposit({
            value: amountInWei, 
            // EIP-1559 specific fields
            maxPriorityFeePerGas: maxPriorityFeePerGas,
            maxFeePerGas: maxFeePerGas,
            nonce: nonce,
            chainId: 137  // Make sure the chain ID is correct for Polygon Mainnet
        });
        
        console.log("Transaction hash:", txResponse.hash);
        console.log("Transaction sent with amount (wei):", amountInWei.toString());

        // Wait for the transaction to be confirmed
        const receipt = await txResponse.wait();
        console.log("Transaction confirmed in block:", receipt.blockNumber);
    } catch (error) {
        console.error("Error during the deposit transaction:", error);
    }
}

wrapMATIC('0.1', '100', 0);