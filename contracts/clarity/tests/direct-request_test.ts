// @ts-ignore
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.13.0/index.ts';
// @ts-ignore
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

function getEventElements(event: String){
    const splittedParams = event.split(',');
    let elements: {[name: string]: string} = {};
    splittedParams.forEach((obj: string) => {
        const arr = obj.split(':');
        elements[arr[0].replace(/\s+/g, '').toString()] = arr[1].replace(/\s+/g, '').toString();
    });
    return elements;
}

Clarinet.test({
    name: "Ensure that consumer <...>",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const wallet_1 = accounts.get("wallet_1")!;
        const wallet_2 = accounts.get("wallet_2")!;
        const wallet1Address = wallet_1.address;
        const wallet2Address = wallet_2.address;

        const oracleContractAddress = types.principal(deployer.address+".oracle");
        const directRequestContractAddress =  types.principal(deployer.address+".direct-request");
        const transferFailureError = 20;
        const data = '0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d';

        const createRequestParams = [
            "0x3334346664393436386561363437623838633530336461633830383263306134",
            "0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145",
            "0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d",
            oracleContractAddress,
            directRequestContractAddress,
            directRequestContractAddress,
        ];

        // TODO: Update the logic here :  it should get some error as wallet1 principal doesn't have any stxlink token
        let block = chain.mineBlock([
            Tx.contractCall("direct-request", "create-request", createRequestParams, wallet1Address),
            Tx.contractCall("stxlink-token", "get-balance", [types.principal(wallet1Address)], deployer.address),        
        ]);
        
        // Success: ran trasfer-failure succesfully called in error case
        block.receipts[0].result.expectOk();
        // Expect: wallet1Address stx-link balance = 0
        block.receipts[1].result.expectOk().expectUint(0);

        block = chain.mineBlock([
            Tx.contractCall("stxlink-token", "mint-tokens", [types.uint(2000), types.principal(wallet1Address)],  deployer.address),
            Tx.contractCall("direct-request", "read-data-value", [],  wallet1Address),
            Tx.contractCall("direct-request", "create-request", createRequestParams, wallet1Address),
            Tx.contractCall("direct-request", "transfer-failure", [types.uint(transferFailureError)], wallet1Address),    
        ]);
        const { receipts } = block;

        // Success:  mint tokens
        receipts[0].result
        .expectOk()
        .expectBool(true);
        
        // Success: Initial data should be none
        receipts[1].result
        .expectNone();

        // Success: Direct Request initiate
        receipts[2].result
        .expectOk()
        .expectBool(true);

        const events = receipts[2].events;
        assertEquals(events.length, 2);

        const [ftTransferEvent, contractEvent] = events;
        const {sender, recipient, amount} = ftTransferEvent.ft_transfer_event;
        sender.expectPrincipal("ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5");
        recipient.expectPrincipal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.oracle");
        amount.expectInt(1);
        
        const {topic, contract_identifier} = contractEvent.contract_event;
        assertEquals(topic, "print");
        assertEquals(contract_identifier, "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.oracle");

        receipts[3].result
        .expectOk()
        .expectUint(transferFailureError);

        const elements = getEventElements(contractEvent.contract_event.value)
        const fulfillmentRequestParams = [
            elements.request_id,
            types.principal(deployer.address+".direct-request"),
            elements.expiration,
            elements.request_count,
            "0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145",
            types.some('0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d'),
        ];
        
        block = chain.mineBlock([
            //Fulfilling request using Wallet-2 that is listed in oracle as initiator (expecting (ok true))
            Tx.contractCall("oracle", "fullfill-oracle-request", fulfillmentRequestParams, deployer.address),
            //Now data should not be none after fulfilling request
            Tx.contractCall("direct-request", "read-data-value", [], deployer.address),
        ]);

        block.receipts[0].result
        .expectOk()
        .expectBool(true);

        // Success: Data present after fullfillment
        block.receipts[1].result 
        .expectSome();

    },
});
