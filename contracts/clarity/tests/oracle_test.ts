
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.6.0/index.ts';
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
    name: "Ensure that oracle <...>",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet_1 = accounts.get("wallet_1")!;
        const wallet_2 = accounts.get("wallet_2")!;
        
        let oraclerequestParams= [
            types.principal(wallet_1.address),
            types.uint(500),
            "0x3334346664393436386561363437623838633530336461633830383263306134",
            "0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145",
            types.principal("ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.direct-request"),
            types.uint(0),
            types.uint(0),
            "0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d",
        ];
            let errorOracleRequestParams = oraclerequestParams.slice();
            errorOracleRequestParams[1]= types.uint(0);
        
        let block = chain.mineBlock([
            
            //First correct request and expecting (ok true)
            Tx.contractCall("oracle", "oracle-request", oraclerequestParams, wallet_1.address),

           //Checking that reuest count is u1
            Tx.contractCall("oracle", "get-request-count", [], wallet_1.address),


            //Expecting u10 error while sending u0 STX
            Tx.contractCall("oracle", "oracle-request", errorOracleRequestParams, wallet_1.address),

             //Checking that request count is still u1 after only one successful request.
            Tx.contractCall("oracle", "get-request-count", [], wallet_1.address),

 
    ]);
        // assertEquals(block.receipts.length, 0);
        // assertEquals(block.height, 3);

        block.receipts[0].result // correct oracle-request
        .expectOk()
        .expectBool(true);

        block.receipts[1].result //checking request count 
        .expectOk()
        .expectUint(1);

        block.receipts[2].result //expecting err-stx-transfer-failed (err u10) for sending u0 STX 
        .expectErr()
        .expectUint(10);

        block.receipts[3].result //checking request count (should be u1) after only one successful request
        .expectOk()
        .expectUint(1);

        // This code is used to get the response values of first request in order to fulfill that request in the oracle
        let event = block.receipts[0].events[1];
        let {contract_event} = event;
        let {value} = contract_event;
        let elements = getEventElements(value); //getting response elements of first oracle request

        let fulfillmentRequestParams = [
            elements.hashed_val,
            types.uint(500),
            types.principal("ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.direct-request"),
            elements.expiration,
            elements.request_count,
            "0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145",
            types.some('0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d'),
        ];

        let wrongRequestIdFulfillmentRequestParams = fulfillmentRequestParams.slice();
        wrongRequestIdFulfillmentRequestParams[0] = "0x3026caace813773adf1069e4bcd5431e510be93a88c317a646c36d6d50c7f580";
        
        let wrongExpirationFulfillmentRequestParams = fulfillmentRequestParams.slice();
        wrongExpirationFulfillmentRequestParams[3] = types.uint(5);

        block = chain.mineBlock([

            //Checking that request count is u1
            Tx.contractCall("oracle", "get-request-count", [], wallet_2.address),

            //Expecting request err-reconstructed-id-not-equal error. //(here request-id sent is incorrect) err-reconstructed-id-not-equal (err u14))
            Tx.contractCall("oracle", "fullfill-oracle-request", wrongRequestIdFulfillmentRequestParams, wallet_1.address),

            //Expecting request id does not match error. //(here reconstructed-request-id does not match beacuse expiration sent is incorrect) err-reconstructed-id-not-equal (err u14))
            Tx.contractCall("oracle", "fullfill-oracle-request", wrongExpirationFulfillmentRequestParams, wallet_1.address),

            //Using Wallet-2 that is listed in oracle as initiator (expecting (ok true)). We have set the public address of Wallet-2 as initiator in oracle.clar for testing the contract owner functionality
            Tx.contractCall("oracle", "fullfill-oracle-request", fulfillmentRequestParams, wallet_2.address),

            //Using Wallet-1 instead of Wallet-2(That is being used as an initiator in oracle.clar) expecting err-invalid-tx-sender (err u16).
            Tx.contractCall("oracle", "fullfill-oracle-request", fulfillmentRequestParams, wallet_1.address),
        ]);

        block.receipts[0].result //request count is u1
        .expectOk()
        .expectUint(1);

        block.receipts[1].result // err-reconstructed-id-not-equal (err u14))
        .expectErr()
        .expectUint(14);

        block.receipts[2].result // err-reconstructed-id-not-equal (err u14))
        .expectErr()
        .expectUint(14);

        block.receipts[3].result //correct fulfillemnt request using wallet_2(initiator address)
        .expectOk()
        .expectBool(true);

        block.receipts[4].result //expecting err-invalid-tx-sender for using different transaction sender than initiator
        .expectErr()
        .expectUint(16);

    },
});
