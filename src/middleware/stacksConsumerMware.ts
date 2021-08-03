import Web3 from 'web3';
import { readFileSync } from 'fs';
import HDWalletProvider from '@truffle/hdwallet-provider';
let provider = new HDWalletProvider(
  process.env.ETH_ADDR_PRIVATE_KEY!,
  `https://${process.env.ETH_NETWORK_NAME}.infura.io/v3/${process.env.INFURA_API_KEY}`
);
const web3 = new Web3(provider);
const consumerContractABI = JSON.parse(
  readFileSync('src/contract-abi/stacksRequestConsumer.json', 'utf-8')
);
const oracleContractABI = JSON.parse(readFileSync('src/contract-abi/oracle.json', 'utf-8'));

let oracleRequestABI = oracleContractABI.find(
  (obj: { name: string }) => obj.name === 'OracleRequest'
);
const contract = new web3.eth.Contract(consumerContractABI, process.env.CONSUMER_CONTRACT_ADDR);

let options = {
  from: process.env.ETH_ADDR,
  gasPrice: web3.utils.toHex(web3.utils.toWei('10', 'gwei')),
  gas: web3.utils.toHex(150000),
};
export async function getRequest(oracleAddress: string, jobId: string, url: string, path: string) {
  return new Promise((resolve, _reject) => {
    let response = {
      status: false,
      txHash: null,
      blockHash: null,
      blockNumber: null,
      requestId: null,
      requesterContractADDR: null,
      error: { status: false, msg: null },
    };
    contract.methods
      .getRequest(oracleAddress, jobId, url, path)
      .send(options)
      .on('receipt', function (receipt: any) {
        if (
          receipt.status == true &&
          receipt.transactionHash &&
          receipt.blockHash &&
          receipt.blockNumber &&
          receipt.events.length != 0
        ) {
          let requestEventDecoded: any = web3.eth.abi.decodeLog(
            oracleRequestABI.inputs,
            receipt.events[2].raw.data,
            receipt.events[2].raw.topics
          );
          response.status = receipt.status;
          response.txHash = receipt.transactionHash;
          response.blockHash = receipt.blockHash;
          response.blockNumber = receipt.blockNumber;
          response.requestId = requestEventDecoded.requestId;
          response.requesterContractADDR = requestEventDecoded.requester;
        }
        resolve(response);
      })
      .on('error', function (error: null, receipt: any) {
        // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
        console.log('Error Encountered', error);
        if (error) {
          response.error.status = true;
          response.error.msg = error;
        }
        resolve(response);
      });
  });
}
