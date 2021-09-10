
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
    name: "Ensure that consumer <...>",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const wallet_1 = accounts.get("wallet_1")!;
        const wallet_2 = accounts.get("wallet_2")!;
        const wallet1Address = wallet_1.address;
        const wallet2Address = wallet_2.address;

        // const directRequestParams = [
        //     "0x3334346664393436386561363437623838633530336461633830383263306134",
        //     "0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145",
        //     "0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d",
        //     types.principal(deployer.address+".direct-request"),
        // ];

        // let block = chain.mineBlock([
        //     Tx.contractCall("stxlink-token", "mint-tokens", [types.uint(2000), types.principal(wallet1Address)],  deployer.address),
        //     //Successful request
        //     Tx.contractCall("direct-request", "create-request", directRequestParams, wallet1Address),
        //     //Initial data should be none
        //     Tx.contractCall("direct-request", "read-data-value", [],  wallet1Address),      
        // ]);

        // block.receipts[1].result 
        // .expectOk()
        // .expectBool(true);

        // block.receipts[2].result //initially no value present in the data-value variable
        // .expectOk()
        // .expectNone();

        // let event = block.receipts[1].events[1];
        // let {contract_event} = event;
        // let {value} = contract_event;
        // let elements = getEventElements(value);

        // const fulfillmentRequestParams = [
        //     elements.request_id,
        //     types.principal(deployer.address+".direct-request"),
        //     elements.expiration,
        //     elements.request_count,
        //     "0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145",
        //     types.some('0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d'),
        // ];
        
        // block = chain.mineBlock([
        //     //Fulfilling request using Wallet-2 that is listed in oracle as initiator (expecting (ok true))
        //     Tx.contractCall("oracle", "fullfill-oracle-request", fulfillmentRequestParams, deployer.address),
        //     //Now data should not be none after fulfilling request
        //     Tx.contractCall("direct-request", "read-data-value", [], deployer.address),
        // ]);

        // block.receipts[0].result
        // .expectOk()
        // .expectBool(true);

        // block.receipts[1].result //now a value should be present
        // .expectOk()
        // .expectSome();

        const params = [
            "0x3334346664393436386561363437623838633530336461633830383263306134",
            "0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145",
            "0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d",
            types.principal(deployer.address+".oracle"),
            types.principal(deployer.address+".direct-request"),
            types.principal(deployer.address+".direct-request"),
        ];

        let block = chain.mineBlock([
            Tx.contractCall("stxlink-token", "mint-tokens", [types.uint(2000), types.principal(wallet1Address)],  deployer.address),
            Tx.contractCall("stxlink-token", "get-balance", [types.principal(deployer.address+".oracle")], deployer.address),
            Tx.contractCall("direct-request", "create-request", params, wallet1Address),
            Tx.contractCall("stxlink-token", "get-balance", [types.principal(deployer.address+".oracle")], deployer.address),
            Tx.contractCall("oracle", "withdraw-token", [types.principal(wallet2Address), types.uint(1)], deployer.address), 
            Tx.contractCall("stxlink-token", "get-balance", [types.principal(wallet2Address)], deployer.address),
        
        ]);

        console.log('Receipts ', block.receipts);
    },
});
