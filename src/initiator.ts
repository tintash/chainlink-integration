import { ChainID } from '@stacks/transactions/dist/constants';
import { executeChainlinkInitiator, isOracleContract } from './event-helpers';
import { CoreNodeBlockMessage, CoreNodeEventType } from './event-stream/core-node-message';
import { parseMessageTransactions } from './event-stream/reader';
import { printTopic } from './helpers';

export async function processNewBlock(
  chainId: ChainID,
  msg: CoreNodeBlockMessage,
  chainlinkHost: string,
  chainlinkPort: string
): Promise<void> {
  const parsedMsg = parseMessageTransactions(chainId, msg);
  for (const event of parsedMsg.events) {
    if (event.type === CoreNodeEventType.ContractEvent) {
      if (
        isOracleContract(event.contract_event.contract_identifier) &&
        event.contract_event.topic === printTopic
      ) {
        return await executeChainlinkInitiator(
          event.contract_event.raw_value,
          chainlinkHost,
          chainlinkPort
        );
      }
    }
  }
}
