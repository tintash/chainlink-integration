
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.6.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

//This variable is used in code to encode string to buffer array types
var textEncoder = new TextEncoder();

Clarinet.test({
    name: "Ensure that consumer <...>",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let wallet_1 = accounts.get("wallet_1")!;
        let block = chain.mineBlock([
            /* 
             * Add transactions with: 
             * Tx.contractCall(...)
             * 
            */
           //Test no:1 normal request
            // Tx.contractCall("direct-request", "request-api", [
            //     types.buff(textEncoder.encode('0x3334346664393436386561363437623838633530336461633830383263306134')),
            //     types.buff(textEncoder.encode('0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145')),
            //     types.buff(textEncoder.encode('0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d')),
            //     types.principal("ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.direct-request"),
            // ],
            //   wallet_1.address),
            // //hashed_val(request-id): 0x131c025a62b57a22341da6edc2a75a172bad7c76c08069ba7c5f7948a0fa2070
            //  console.log(block.receipts[0].events[1].contract_event.value); //this stetement is used to get request-id of first transaction

            // //Test no:2 fulfilling the upper request
            // Tx.contractCall("oracle", "fullfill-oracle-request", [
            //     types.buff(textEncoder.encode('0x131c025a62b57a22341da6edc2a75a172bad7c76c08069ba7c5f7948a0fa2070')),
            //     types.uint(400),
            //     types.principal("ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.direct-request"),
            //     types.uint(1),
            //     types.uint(1),
            //     types.buff(textEncoder.encode('0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145')),
            //     types.some('0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d'),
            // ],
            // wallet_1.address),    

            //Test no:3 reading data value
            // Tx.contractCall("direct-request", "read-data-value", [

            // ],
            // wallet_1.address),    
        
        ]);
        // assertEquals(block.receipts.length, 0);
        // assertEquals(block.height, 2);

        // block.receipts[0].result
        // .expectOk()
        // .expectBool(true);
        //console.log(block.receipts[0].events[1].contract_event.value[0]); //this stetement is used to get request-id of first transaction

        // block.receipts[1].result
        // .expectOk()
        // .expectBool(true);
        // console.log(block.receipts[1]);

        block = chain.mineBlock([
            /* 
             * Add transactions with: 
             * Tx.contractCall(...)
            */
        ]);
        assertEquals(block.receipts.length, 0);
        assertEquals(block.height, 3);
    },
});
