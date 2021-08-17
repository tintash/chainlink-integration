
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.6.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Ensure that <...>",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const wallet_1 = accounts.get("wallet_1")!; 
        const wallet_2 = accounts.get("wallet_2")!;

        const wallet1Address = wallet_1.address; // Initial Owner
        const wallet2Address = wallet_2.address;
        const buff =    "0x7b22676574223a2268747470733a2f2f6d7b22676574223a2268747470733a2f2f6d";
        let block = chain.mineBlock([
            /* 
             * Add transactions with: 
             * Tx.contractCall(...)
            */

            Tx.contractCall("stxlink-token", "initialize", [types.ascii('STXLINK'), types.ascii('SL'), types.uint(4), types.principal(wallet1Address)], deployer.address),
            Tx.contractCall("stxlink-token", "mint-tokens", [types.uint(2000), types.principal(wallet1Address)],  deployer.address),
            Tx.contractCall("stxlink-token", "get-total-supply", [], deployer.address),
            Tx.contractCall("stxlink-token", "get-balance", [types.principal(wallet1Address)], deployer.address),
            Tx.contractCall("stxlink-token", "transfer", [types.uint(200), types.principal(wallet1Address), types.principal(wallet2Address), types.some(buff)], wallet1Address),
            Tx.contractCall("stxlink-token", "get-balance", [types.principal(wallet1Address)], deployer.address),
            Tx.contractCall("stxlink-token", "transfer", [types.uint(400), types.principal(wallet1Address), types.principal('ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.oracle'), types.some(buff)], wallet1Address),
            Tx.contractCall("stxlink-token", "get-balance", [types.principal(wallet1Address)], deployer.address),
            Tx.contractCall("stxlink-token", "get-balance", [types.principal('ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.oracle')], deployer.address),
            
        ]);
        console.log('', block.receipts);
        //assertEquals(block.receipts.length, 0);
    },
});
