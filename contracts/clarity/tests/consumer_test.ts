
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.6.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Ensure that consumer <...>",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let wallet_1 = accounts.get("wallet_1")!;
        let wallet_2 = accounts.get("wallet_2")!;
        let block = chain.mineBlock([

           //Test no:1 Corrct request
            Tx.contractCall("direct-request", "request-api", [
                "0x3334346664393436386561363437623838633530336461633830383263306134",
                "0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145",
                "0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d",
                types.principal("ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.direct-request"),
            ],
              wallet_1.address),

            //Test:2 Initial data should be none
            Tx.contractCall("direct-request", "read-data-value", [],  wallet_1.address),      
        ]);

        block.receipts[0].result
        .expectOk()
        .expectBool(true);

        block.receipts[1].result //initially no value present in the data-value variable
        .expectOk()
        .expectNone();

        let event = block.receipts[0].events[1];
        let {contract_event} = event;
        let {value} = contract_event;
        const splittedParams = value.split(',');
     
        let elements: {[name: string]: string} = {};
        splittedParams.forEach((obj: string) => {
            const arr = obj.split(':');
            elements[arr[0].replace(/\s+/g, '').toString()] = arr[1].replace(/\s+/g, '').toString();
           
        });
        
        block = chain.mineBlock([
            
            //Test no:3  Fulfilling request using Wallet-2 that is listed in oracle as initiator (expecting (ok true))
            Tx.contractCall("oracle", "fullfill-oracle-request", [
            elements.hashed_val,
            types.uint(500),
            types.principal("ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.direct-request"),
            elements.expiration,
            elements.request_count,
            "0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145",
            types.some('0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d'),
        ],
            wallet_2.address),

            //Test:4 Now data should not be none after fulfilling request
            Tx.contractCall("direct-request", "read-data-value", [],  wallet_1.address),

        ]);

        block.receipts[0].result
        .expectOk()
        .expectBool(true);

        block.receipts[1].result //now a value should be present
        .expectOk()
        .expectSome();
    },
});
