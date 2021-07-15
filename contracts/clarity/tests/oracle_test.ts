
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.6.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';



Clarinet.test({
    name: "Ensure that oracle <...>",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let wallet_1 = accounts.get("wallet_1")!;
        let wallet_2 = accounts.get("wallet_2")!;
        let block = chain.mineBlock([
        //Test no:1 sending first correct request
            Tx.contractCall("oracle", "oracle-request", [
                types.principal(wallet_1.address),
                types.uint(500),
                "0x3334346664393436386561363437623838633530336461633830383263306134",
                "0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145",
                types.principal("ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.direct-request"),
                types.uint(0),
                types.uint(0),
                "0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d",
            ],
              wallet_1.address),

           //Test no:2 checking that reuest count is u1
            Tx.contractCall("oracle", "get-request-count", [], wallet_1.address),
            
            //Test no:3  checking block height
            Tx.contractCall("oracle","get-block-height",[], wallet_1.address),


            //Test no:4 Expecting u10 error while sending u0 STX
            Tx.contractCall("oracle", "oracle-request", [
                types.principal(wallet_1.address),
                types.uint(0),
                "0x3334346664393436386561363437623838633530336461633830383263306134",
                "0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145",
                types.principal("ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.direct-request"),
                types.uint(0),
                types.uint(0),
                "0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d",
            ],
              wallet_1.address),

        //Test no:5 checking that request count is still u1 becuase we have executed only one successful request.
            Tx.contractCall("oracle", "get-request-count", [], wallet_1.address),

 
    ]);
  //      assertEquals(block.receipts.length, 1);
    //    assertEquals(block.height, 2);
        
        block.receipts[0].result
        .expectOk()
        .expectBool(true);

        block.receipts[1].result //checking request count (should be u1)
        .expectOk()
        .expectUint(1);

        block.receipts[2].result //checking block-height (currently theres only one block)
        .expectOk()
        .expectUint(1);

        block.receipts[3].result
        .expectErr()
        .expectUint(10);

        block.receipts[4].result //checking request count (should be u1) afetr error
        .expectOk()
        .expectUint(1);

        // This code is used to get the response values of first request in order to fulfill that request in the oracle
        let event = block.receipts[0].events[1];
        let {contract_event} = event;
        let {value} = contract_event;

        const splittedParams = value.split(',');
     
        let elements: {[name: string]: string} = {};
        splittedParams.forEach((obj: string) => {
            const arr = obj.split(':');
            elements[arr[0].replace(/\s+/g, '').toString()] = arr[1].replace(/\s+/g, '').toString();
           
        });
        //console.log(elements.hashed_val);
        block = chain.mineBlock([
            /* 
             * Add transactions with: 
             * Tx.contractCall(...)
            */
            //Test no:6 checking that request count is u1
            Tx.contractCall("oracle", "get-request-count", [], wallet_2.address),

            //Test no:7 Expecting request id does not match error. //(here request-id sent is incorrect) err-reconstructed-id-not-equal (err u14))
            Tx.contractCall("oracle", "fullfill-oracle-request", [
                "0x3026caace813773adf1069e4bcd5431e510be93a88c317a646c36d6d50c7f580",
                types.uint(500),
                types.principal("ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.direct-request"),
                elements.expiration,
                elements.request_count,
                "0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145",
                types.some('0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d'),
            ],
                wallet_1.address),

            //Test no:8 Expecting request id does not match error. //(here reconstructed-request-id does not match beacuse expiration sent is incorrect) err-reconstructed-id-not-equal (err u14))
            Tx.contractCall("oracle", "fullfill-oracle-request", [
                elements.hashed_val,
                types.uint(500),
                types.principal("ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.direct-request"),
                types.uint(5),
                elements.request_count,
                "0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145",
                types.some('0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d'),
            ],
                wallet_1.address),

            //Test no:9  Using Wallet-2 that is listed in oracle as initiator (expecting (ok true)). We have set the public address of Wallet-2 as initiator in oracle.clar for testing the contract owner functionality
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

            //Test:5 Using Wallet-1 instead of Wallet-2(That is being used as an initiator in oracle.clar) expecting err-invalid-tx-sender (err u16).
            Tx.contractCall("oracle", "fullfill-oracle-request", [
                elements.hashed_val,
                types.uint(500),
                types.principal("ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.direct-request"),
                elements.expiration,
                elements.request_count,
                "0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145",
                types.some('0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d'),
            ],
                wallet_1.address),


        ]);
        // assertEquals(block.receipts.length, 0);
        // assertEquals(block.height, 3);

        block.receipts[0].result
        .expectOk()
        .expectUint(1);

        block.receipts[1].result // err-reconstructed-id-not-equal (err u14))
        .expectErr()
        .expectUint(14);

        block.receipts[2].result // err-reconstructed-id-not-equal (err u14))
        .expectErr()
        .expectUint(14);

        block.receipts[3].result
        .expectOk()
        .expectBool(true);

        block.receipts[4].result
        .expectErr()
        .expectUint(16);

        block.receipts[4].result
        .expectErr()
        .expectUint(16);

    },
});
// Clarinet.test({
//     name: "Ensure that request id does not match  <...>",
//     async fn(chain: Chain, accounts: Map<string, Account>) {
//         let wallet_1 = accounts.get("wallet_1")!;
//         let block = chain.mineBlock([

//         Test no:3 Expecting request id does not match error. (err u12)
//             Tx.contractCall("oracle", "fullfill-oracle-request", [
//                 types.buff(textEncoder.encode('0x131c025a62b57a22341da6edc2a75a172bad7c76c08069ba7c5f7948a0fa2970')),
//                 types.uint(500),
//                 types.principal("ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.direct-request"),
//                 types.uint(0),
//                 types.uint(2),
//                 types.buff(textEncoder.encode('0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145')),
//                 types.some('0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d'),
//             ],
//                 wallet_1.address),

//         //Test no:4 Expececting invalid transaction sender error. (err u16)
//             // For this test, we are commenting this code line in "fullfill-oracle-request",
//             // `(asserts! (is-eq reconstructed-request-id request-id) err-reconstructed-id-not-equal)`
            
//             // Tx.contractCall("oracle", "fullfill-oracle-request", [
//             //     types.buff(textEncoder.encode('0x131c025a62b57a22341da6edc2a75a172bad7c76c08069ba7c5f7948a0fa2970')),
//             //     types.uint(500),
//             //     types.principal("ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.direct-request"),
//             //     types.uint(0),
//             //     types.uint(2),
//             //     types.buff(textEncoder.encode('0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145')),
//             //     types.some('0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d'),
//             // ],
//             // wallet_1.address),
//         //Test no:5 Expececting request not found error because request is already expired.  err-request-not-found (err u13)
//             // for this test commenting the the following 2 lines in the "fullfill-oracle-request" function
//             //(asserts! (is-eq reconstructed-request-id request-id) err-reconstructed-id-not-equal)                                                         ;; reconstructed-request-id and request-id not equal
//             //(asserts! (is-valid-owner?) err-invalid-tx-sender)     

//             // Tx.contractCall("oracle", "fullfill-oracle-request", [
//             //     types.buff(textEncoder.encode('0x131c025a62b57a22341da6edc2a75a172bad7c76c08069ba7c5f7948a0fa2970')),
//             //     types.uint(500),
//             //     types.principal("ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.direct-request"),
//             //     types.uint(0),
//             //     types.uint(2),
//             //     types.buff(textEncoder.encode('0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145')),
//             //     types.some('0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d'),
//             // ],
//             // wallet_1.address),

//         //Test no:6 Expececting (ok true)request not expired because (request time doesn't exceeded the limit) the block-height passed is less than the limit set in oracle contract 
//             // for this test commenting the the following 3 lines in the "fullfill-oracle-request" function
//             //(asserts! (is-eq reconstructed-request-id request-id) err-reconstructed-id-not-equal)                                                           ;; reconstructed-request-id and request-id not equal
//             //(asserts! (is-valid-owner?) err-invalid-tx-sender)                                                                                              ;; check tx-sender validity
//             //(asserts! (is-some (map-get? request-ids { request-id: reconstructed-request-id })) err-request-not-found)

//             // Tx.contractCall("oracle", "fullfill-oracle-request", [
//             //     types.buff(textEncoder.encode('0x131c025a62b57a22341da6edc2a75a172bad7c76c08069ba7c5f7948a0fa2970')),
//             //     types.uint(500),
//             //     types.principal("ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.direct-request"),
//             //     types.uint(10001),
//             //     types.uint(2),
//             //     types.buff(textEncoder.encode('0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145')),
//             //     types.some('0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d'),
//             // ],
//             // wallet_1.address),     
//     ]);
//   //      assertEquals(block.receipts.length, 1);
//     //    assertEquals(block.height, 2);
        
//         block.receipts[].result
//         .expectOk()
//         .expectBool(true);

//         // block.receipts[1].result
//         // .expectErr()
//         // .expectUint(10);

//         // block.receipts[2].result //Test no:3 err-reconstructed-id-not-equal (err u14)
//         // .expectErr()
//         // .expectUint(14);

//         // block.receipts[2].result //Test no:4 err-invalid-tx-sender (err u16)
//         // .expectErr()
//         // .expectUint(16);

//         // block.receipts[2].result //Test no:5  err-request-not-found (err u13)
//         // .expectErr()
//         // .expectUint(13);

//         // block.receipts[2].result //Test no:6  request not expired
//         // .expectOk()
//         // .expectBool(true);
       

//         block = chain.mineBlock([
//             /* 
//              * Add transactions with: 
//              * Tx.contractCall(...)
//             */

//         ]);
//         assertEquals(block.receipts.length, 0);
//         assertEquals(block.height, 3);
//     },
// });



