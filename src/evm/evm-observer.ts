import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { readFileSync } from 'fs';
import { processEVMFulfullmentEvent } from './evm-adapter';

export function createEVMObserver() {
  const web3 = new Web3(String(process.env.ETHEREUM_URL));
  const oracleContractABI = JSON.parse(
    readFileSync('src/contract-abi/evm-direct-request-consumer-abi.json', 'utf-8')
  );

  const oracle = new web3.eth.Contract(
    oracleContractABI as AbiItem[],
    String(process.env.ETHEREUM_STACKS_CONTRACT_CONSUMER_CONTRACT)
  );

  const emitter = oracle.events.GetRequestFulfilled({}, function (error: any, event: any) {
    const evmRequestId = event.raw.topics[1];
    const evmResult = web3.utils.toAscii(event.raw.topics[2]);
    const processResult = processEVMFulfullmentEvent(evmRequestId, evmResult);
    console.log(processResult);
  });
}
