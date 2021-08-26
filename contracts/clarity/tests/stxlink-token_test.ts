
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.6.0/index.ts';

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
            types.principal("ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.direct-request"),
        ];

        let block = chain.mineBlock([
            // Token Initialization
            Tx.contractCall("stxlink-token", "initialize", [types.ascii('STXLINK'), types.ascii('SL'), types.uint(4), types.principal(wallet1Address)], deployer.address),
            Tx.contractCall("stxlink-token", "mint-tokens", [types.uint(2000), types.principal(wallet1Address)],  deployer.address),
            Tx.contractCall("stxlink-token", "get-balance", [types.principal(wallet1Address)], deployer.address),
            Tx.contractCall("direct-request", "create-request", directRequestParams, wallet1Address),
            Tx.contractCall("stxlink-token", "get-balance", [types.principal('ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.oracle')], wallet1Address),
            Tx.contractCall("stxlink-token", "get-balance", [types.principal(wallet1Address)], deployer.address),
        ]);
        
        console.log('Receipts ', block.receipts);
    },
});
