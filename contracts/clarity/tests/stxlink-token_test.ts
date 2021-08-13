
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.6.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Ensure that <...>",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const wallet_1 = accounts.get("wallet_1")!;
        const wallet_2 = accounts.get("wallet_2")!;

        console.log('Deployer',  deployer);

        const wallet1Address = wallet_1.address;
        let block = chain.mineBlock([
            /* 
             * Add transactions with: 
             * Tx.contractCall(...)
            */

            Tx.contractCall("stxlink-token", "initialize", [types.ascii('STXLINK'), types.ascii('SL'), types.uint(4), types.principal(wallet1Address)], deployer.address),
            Tx.contractCall("stxlink-token", "get-name", [], wallet_1.address),
        ]);
        console.log('Nouman', block.receipts);
        //assertEquals(block.receipts.length, 0);
    },
});
