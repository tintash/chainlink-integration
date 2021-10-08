
// @ts-ignore
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.13.0/index.ts';

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
    name: "Ensure that oracle create chainlink request updates count and fulfill request succesfully",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const wallet_1 = accounts.get("wallet_1")!;
        const wallet_2 = accounts.get("wallet_2")!;

        const wallet1Address = wallet_1.address;
        
        const oraclerequestParams= [
            types.principal(wallet1Address),
            "0x3334346664393436386561363437623838633530336461633830383263306134",
            "0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145",
            types.principal(deployer.address+".direct-request"),
            types.uint(1),
            types.uint(0),
            types.uint(0),
            "0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d",
        ];
        
        let block = chain.mineBlock([
            //First correct request and expecting (ok true)
            Tx.contractCall("oracle", "oracle-request", oraclerequestParams, deployer.address),

            //Checking that reuest count is u1
            Tx.contractCall("oracle", "get-request-count", [], deployer.address),

            //Checking that request count is still u1 after only one successful request.
            Tx.contractCall("oracle", "get-request-count", [], deployer.address),
        ]);
        
        block.receipts[0].result // correct oracle-request
        .expectOk()
        .expectBool(true);

        block.receipts[1].result //checking request count 
        .expectUint(1);

        block.receipts[2].result //checking request count (should be u1) after only one successful request
        .expectUint(1);

        // This code is used to get the response values of first request in order to fulfill that request in the oracle
        let event = block.receipts[0].events[0];
        let {contract_event} = event;
        let {value} = contract_event;
        let elements = getEventElements(value); //getting response elements of first oracle request

        // Creating the invalid request ID
        const invalidRequestId = elements.request_id.split('x');
        invalidRequestId[1] = invalidRequestId[1].split('').reverse().join('');
        
        block = chain.mineBlock([
            Tx.contractCall("oracle", "is-request-present", [elements.request_id], deployer.address),
            Tx.contractCall("oracle", "is-request-present", [invalidRequestId[0]+'x'+invalidRequestId[1]], deployer.address),
        ]);

        // Contract has the request ID
        const [receiptSuccess, receiptFailure] = block.receipts;
        receiptSuccess.result.expectBool(true);
        receiptFailure.result.expectBool(false);

        let fulfillmentRequestParams = [
            elements.request_id,
            types.principal(deployer.address+".direct-request"),
            elements.expiration,
            elements.request_count,
            "0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145",
            types.some('0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d'),
        ];

        const invalidRequestIdFulfillmentRequestParams = [...fulfillmentRequestParams];
        invalidRequestIdFulfillmentRequestParams[0] = "0x3026caace813773adf1069e4bcd5431e510be93a88c317a646c36d6d50c7f580";
        
        const invalidExpirationFulfillmentRequestParams = [...fulfillmentRequestParams];
        invalidExpirationFulfillmentRequestParams[3] = types.uint(5);

        block = chain.mineBlock([

            //Checking that request count is u1
            Tx.contractCall("oracle", "get-request-count", [], deployer.address),

            //Expecting request err-reconstructed-id-not-equal error. //(here request-id sent is incorrect) err-reconstructed-id-not-equal (err u14))
            Tx.contractCall("oracle", "fullfill-oracle-request", invalidRequestIdFulfillmentRequestParams, deployer.address),

            //Expecting request id does not match error. //(here reconstructed-request-id does not match beacuse expiration sent is incorrect) err-reconstructed-id-not-equal (err u14))
            Tx.contractCall("oracle", "fullfill-oracle-request", invalidExpirationFulfillmentRequestParams, deployer.address),

            //Using Wallet-2 that is listed in oracle as initiator (expecting (ok true)). We have set the public address of Wallet-2 as initiator in oracle.clar for testing the contract owner functionality
            Tx.contractCall("oracle", "fullfill-oracle-request", fulfillmentRequestParams, deployer.address),

        ]);

        block.receipts[0].result //request count is u1
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

        // Cancel Request Flow
        block = chain.mineBlock([
            // trying to cancel request with invalidate request id (already consumed)
            Tx.contractCall("oracle", "cancel-request", [elements.request_id], deployer.address),
            // generating the new request id 
            Tx.contractCall("oracle", "oracle-request", oraclerequestParams, deployer.address)

        ]);

        const [cancelRequestFailure, oracleRequest]  = block.receipts;
        event = oracleRequest.events[0];
        elements = getEventElements(event.contract_event.value);

        // Success: returning false on invalidate request id
        cancelRequestFailure.result.expectOk().expectBool(false);


        block = chain.mineBlock([
            Tx.contractCall("oracle", "cancel-request", [elements.request_id], deployer.address)
        ]);

        // Success: returning true with valid request ID
        block.receipts[0].result.expectOk().expectBool(true);

        const oracleContractAddress = types.principal(deployer.address+".oracle");
        const directRequestContractAddress =  types.principal(deployer.address+".direct-request");

        const createRequestParams = [
            "0x3334346664393436386561363437623838633530336461633830383263306134",
            "0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145",
            "0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d",
            oracleContractAddress,
            directRequestContractAddress,
            directRequestContractAddress,
        ];

        block = chain.mineBlock([
            Tx.contractCall("stxlink-token", "mint-tokens", [types.uint(2000), types.principal(wallet1Address)],  deployer.address),
            Tx.contractCall("direct-request", "read-data-value", [],  wallet1Address),
            Tx.contractCall("direct-request", "create-request", createRequestParams, wallet1Address),
            Tx.contractCall("oracle", "withdraw-token", [types.principal(deployer.address), types.uint(4)], deployer.address),
            Tx.contractCall("oracle", "withdraw-token", [types.principal(deployer.address), types.uint(1)], deployer.address),     
        ]);

        block.receipts[3].result.expectErr().expectUint(18);

        block.receipts[4].result.expectOk().expectBool(true);
       // TODO: check for events 

    },
});
