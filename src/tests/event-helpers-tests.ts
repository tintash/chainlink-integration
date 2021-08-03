import { ChainID } from '@stacks/transactions';
import { getOracleContract, getOracleContractPrincipal } from '../event-helpers';

test('get oracle contract', () => {
  const result = getOracleContract(ChainID.Testnet);
  expect(result.address).toBe('ST248M2G9DF9G5CX42C31DG04B3H47VJK6W73JDNC');
  expect(result.name).toBe('oracle');
});

test('get oracle contract: Mainnet', () => {
  const result = getOracleContract(ChainID.Mainnet);
  //TODO: Needs to be updated once we have mainnet contract deployed
  expect(result.address).toBe('ST248M2G9DF9G5CX42C31DG04B3H47VJK6W73JDNC');
  expect(result.name).toBe('oracle');
});

test('get oracle contract principle', () => {
  const result = getOracleContractPrincipal(ChainID.Testnet);
  expect(result).toBe('ST248M2G9DF9G5CX42C31DG04B3H47VJK6W73JDNC.oracle');
});

test('get oracle contract principle: Mainnet', () => {
  const result = getOracleContractPrincipal(ChainID.Mainnet);
  //TODO: Needs to be updated once we have mainnet contract deployed
  expect(result).toBe('ST248M2G9DF9G5CX42C31DG04B3H47VJK6W73JDNC.oracle');
});
