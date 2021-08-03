import { contract, EVMResponse, options, oracleRequestABI, web3 } from './evm-constants';

export async function getRequest(
  oracleAddress: string,
  jobId: string,
  url: string,
  path: string
): Promise<EVMResponse> {
  return new Promise((resolve, _reject) => {
    contract.methods
      .getRequest(oracleAddress, jobId, url, path)
      .send(options)
      .on('receipt', function (receipt: any) {
        const { status, transactionHash, blockHash, blockNumber, events } = receipt;
        if (status == true && transactionHash && blockHash && blockNumber && events.length != 0) {
          const requestEventDecoded: { [key: string]: string } = web3.eth.abi.decodeLog(
            oracleRequestABI.inputs,
            receipt.events[2].raw.data,
            receipt.events[2].raw.topics
          );
          const { requestId, requester } = requestEventDecoded;
          const result: EVMResponse = {
            status: status,
            txHash: transactionHash,
            blockHash: blockHash,
            blockNumber: blockNumber,
            requestId: requestId,
            requesterContractADDR: requester,
          };
          resolve(result);
        }
      })
      .on('error', function (error: any, receipt: any) {
        // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
        console.log('Error Encountered', error);
        throw new Error(`Transaction Failed ${error}`);
      });
  });
}
