import Web3 from 'web3';
import { readFileSync } from 'fs';
import HDWalletProvider from '@truffle/hdwallet-provider';
const provider = new HDWalletProvider(
  String(process.env.ETH_ADDR_PRIVATE_KEY),
  `https://${process.env.ETH_NETWORK_NAME}.infura.io/v3/${process.env.INFURA_API_KEY}`
);
const web3 = new Web3(provider);
const consumerContractABI = JSON.parse(
  readFileSync('src/contract-abi/stacksRequestConsumer.json', 'utf-8')
);
const oracleContractABI = JSON.parse(readFileSync('src/contract-abi/oracle.json', 'utf-8'));

const oracleRequestABI = oracleContractABI.find(
  (obj: { name: string }) => obj.name === 'OracleRequest'
);
const contract = new web3.eth.Contract(
  consumerContractABI,
  process.env.ETHEREUM_STACKS_CONTRACT_CONSUMER_CONTRACT
);

const options = {
  from: process.env.ETH_ADDR,
  gasPrice: web3.utils.toHex(web3.utils.toWei('4', 'gwei')),
  gas: web3.utils.toHex(150000),
};

interface EvmResponse {
  status: Boolean;
  txHash: String;
  blockHash: String;
  blockNumber: Number;
  requestId: String;
  requesterContractADDR: String;
}
export async function getRequest(oracleAddress: string, jobId: string, url: string, path: string) {
  return new Promise((resolve, _reject) => {
    contract.methods
      .getRequest(oracleAddress, jobId, url, path)
      .send(options)
      .on('receipt', function (receipt: any) {
        const { status, transactionHash, blockHash, blockNumber, events } = receipt;
        var response:EvmResponse
        if (status == true && transactionHash && blockHash && blockNumber && events.length != 0) {
          const requestEventDecoded: { [key: string]: string } = web3.eth.abi.decodeLog(
            oracleRequestABI.inputs,
            receipt.events[2].raw.data,
            receipt.events[2].raw.topics
          );
          console.log('here goes recepipt', receipt);
          const { requestId, requester } = requestEventDecoded;
           response = {
            status,
            txHash: transactionHash,
            blockHash,
            blockNumber,
            requestId,
            requesterContractADDR: requester,
          };
          resolve(response);
        }
      })
      .on('error', function (error: any, receipt: any) {
        // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
        console.log('Error Encountered', error);
        throw new Error(`Transaction Failed ${error}`);
      });
  });
}
