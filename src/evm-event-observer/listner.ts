import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { readFileSync } from 'fs';

export function createEVMObserver() {
  const web3 = new Web3(String(process.env.ETHEREUM_URL));
  const oracleContractABI = JSON.parse(readFileSync('src/contract-abi/oracle.json', 'utf-8'));

  const oracle = new web3.eth.Contract(
    oracleContractABI as AbiItem[],
    String(process.env.ETHEREUM_CHAINLINK_ORACLE_CONTRACT)
  );

  return oracle.events.OracleRequest({}, function (error: any, event: any) {
    console.log(event);
  });
}
