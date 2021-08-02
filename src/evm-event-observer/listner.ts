import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { OracleContractABI } from './abi';

export function createEVMObserver() {
  const web3 = new Web3(String(process.env.ETHEREUM_URL));
  const oracle = new web3.eth.Contract(
    OracleContractABI as AbiItem[],
    String(process.env.ETHEREUM_CHAINLINK_ORACLE_CONTRACT)
  );
  return oracle.events.OracleRequest({}, function (error: any, event: any) {
    console.log(event);
  });
}
