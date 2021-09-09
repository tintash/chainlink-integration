
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.13.0/index.ts';
import { assertEquals } from "https://deno.land/std@0.90.0/testing/asserts.ts";

Clarinet.test({
    name: "Ensure that <...>",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const wallet_1 = accounts.get("wallet_1")!; 
        const wallet_2 = accounts.get("wallet_2")!;

        const wallet1Address = wallet_1.address; // Initial Owner
        const directRequestParams = [
            "0x3334346664393436386561363437623838633530336461633830383263306134",
            "0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145",
            "0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d",
            types.principal(deployer.address+".oracle"),
            types.principal(deployer.address+".direct-request"),
            types.principal(deployer.address+'.direct-request'),
        ];

        let block = chain.mineBlock([
            // Token Initialization
            Tx.contractCall("stxlink-token", "add-principal-to-role", [types.uint(1), types.principal(wallet1Address)], deployer.address),
            Tx.contractCall("stxlink-token", "mint-tokens", [types.uint(2000), types.principal(wallet1Address)],  wallet1Address),
            Tx.contractCall("stxlink-token", "get-balance", [types.principal(wallet1Address)], deployer.address),
            Tx.contractCall("direct-request", "create-request", directRequestParams, wallet1Address),
            Tx.contractCall("stxlink-token", "get-balance", [types.principal(deployer.address+'.oracle')], wallet1Address),
            Tx.contractCall("stxlink-token", "get-balance", [types.principal(wallet1Address)], deployer.address),
        ]);

        block.receipts[0].result 
        .expectOk()
        .expectBool(true);
        assertEquals(block.receipts[0].events.length, 1);

        block.receipts[1].result 
        .expectOk()
        .expectBool(true);
        assertEquals(block.receipts[1].events.length, 2);

        block.receipts[2].result 
        .expectOk()
        .expectUint(2000);
        
        block.receipts[3].result 
        .expectOk()
        .expectBool(true);
        assertEquals(block.receipts[3].events.length, 2);

        block.receipts[4].result 
        .expectOk()
        .expectUint(1);

        block.receipts[5].result 
        .expectOk()
        .expectUint(1999);
    },
});
