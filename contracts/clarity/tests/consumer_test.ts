
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.6.0/index.ts';

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
        const wallet_1 = accounts.get("wallet_1")!;
        const wallet_2 = accounts.get("wallet_2")!;

        let directRequestParams = [
            "0x3334346664393436386561363437623838633530336461633830383263306134",
            "0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145",
            "0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d",
            types.principal("ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.direct-request"),
        ];

        let block = chain.mineBlock([
            
           //Correct request
            Tx.contractCall("direct-request", "request-api", directRequestParams, wallet_1.address),

            //Initial data should be none
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
        let elements = getEventElements(value);

        let fulfillmentRequestParams = [
            elements.hashed_val,
            types.uint(500),
            types.principal("ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.direct-request"),
            elements.expiration,
            elements.request_count,
            "0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145",
            types.some('0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d'),
        ];
        
        block = chain.mineBlock([

            //Fulfilling request using Wallet-2 that is listed in oracle as initiator (expecting (ok true))
            Tx.contractCall("oracle", "fullfill-oracle-request", fulfillmentRequestParams,
            wallet_2.address),

            //Now data should not be none after fulfilling request
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
