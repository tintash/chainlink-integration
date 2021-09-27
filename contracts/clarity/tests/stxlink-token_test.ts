// @ts-ignore
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.13.0/index.ts';
// @ts-ignore
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

// Test Contract Initialization State
Clarinet.test({
  name: 'stxlink-token: returns the correct values for read only fns at initialization',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    let wallet_2 = accounts.get('wallet_2')!;

    var call = await chain.callReadOnlyFn(
      'stxlink-token',
      'get-total-supply',
      [],
      deployer.address
    );

    // Success: Total supply should be equal to initially minted tokens = 2000
    call.result.expectOk().expectUint(2000);

    call = await chain.callReadOnlyFn(
      'stxlink-token',
      'get-balance',
      [types.principal('STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6')],
      wallet_2.address
    );
    // Success: Balance of initial minter address should be = 2000
    call.result.expectOk().expectUint(2000);

    call = await chain.callReadOnlyFn('stxlink-token', 'get-name', [], wallet_2.address);

    // Success: name = STXLINK
    call.result.expectOk().expectAscii('STXLINK');

    call = await chain.callReadOnlyFn('stxlink-token', 'get-symbol', [], wallet_2.address);

    // Success: symbol = SL
    call.result.expectOk().expectAscii('SL');

    call = await chain.callReadOnlyFn('stxlink-token', 'get-decimals', [], deployer.address);
    // Success: decimal = 1
    call.result.expectOk().expectUint(1);

    // Success: deployer = deployer.address
    call = await chain.callReadOnlyFn('stxlink-token', 'get-deployer', [], wallet_1.address);
    call.result.expectOk().expectPrincipal(deployer.address);

    // Test owner and minter roles assigned at initialization
    call = await chain.callReadOnlyFn(
      'stxlink-token',
      'has-role',
      [types.uint(0), types.principal(deployer.address)],
      deployer.address
    );
    // Success: owner role assigned to deployer at initialization
    call.result.expectBool(true);

    call = await chain.callReadOnlyFn(
      'stxlink-token',
      'has-role',
      [types.uint(1), types.principal(deployer.address)],
      deployer.address
    );
    // Success: minter role assigned to deployer at initialization
    call.result.expectBool(true);
    call = await chain.callReadOnlyFn(
      'stxlink-token',
      'is-blacklisted',
      [types.principal(deployer.address)],
      deployer.address
    );
    call.result.expectBool(false);

    call = await chain.callReadOnlyFn(
      'stxlink-token',
      'detect-transfer-restriction',
      [types.uint(200), types.principal(deployer.address), types.principal(wallet_2.address)],
      deployer.address
    );
    call.result.expectOk().expectUint(0);

    call = await chain.callReadOnlyFn(
      'stxlink-token',
      'message-for-restriction',
      [types.uint(0)],
      wallet_2.address
    );
    call.result.expectOk().expectAscii('No Restriction Detected');

    call = await chain.callReadOnlyFn(
      'stxlink-token',
      'message-for-restriction',
      [types.uint(1)],
      wallet_2.address
    );
    call.result
      .expectOk()
      .expectAscii('Sender or recipient is on the blacklist and prevented from transacting');

    call = await chain.callReadOnlyFn(
      'stxlink-token',
      'message-for-restriction',
      [types.uint(3)],
      wallet_2.address
    );
    call.result.expectOk().expectAscii('Unknown Error Code');
  },
});

// Test Blacklisting
Clarinet.test({
  name: 'Ensure it updates blacklist with role',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;
    const wallet1Address = wallet_1.address;

    let block = chain.mineBlock([
      Tx.contractCall(
        'stxlink-token',
        'update-blacklisted',
        [types.principal(wallet1Address), types.bool(true)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'add-principal-to-role',
        [types.uint(4), types.principal(wallet1Address)],
        wallet1Address
      ),

      Tx.contractCall(
        'stxlink-token',
        'add-principal-to-role',
        [types.uint(4), types.principal(wallet1Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'update-blacklisted',
        [types.principal(wallet_2.address), types.bool(true)],
        wallet1Address
      ),

      Tx.contractCall(
        'stxlink-token',
        'is-blacklisted',
        [types.principal(wallet_2.address)],
        wallet1Address
      ),
    ]);

    // Error: Forbidden account cannot update blacklist if it is not assigned blacklister role
    block.receipts[0].result.expectErr().expectUint(403);

    // Error: Forbidden account cannot assign blacklister role if it is not assigned owner role
    block.receipts[1].result.expectErr().expectUint(403);

    // Success: owner account assigns wallet1Address blacklister role
    block.receipts[2].result.expectOk().expectBool(true);
    assertEquals(block.receipts[2].events.length, 1);

    // Success: wallet1Address blacklists wallet_2 address
    block.receipts[3].result.expectOk().expectBool(true);
    assertEquals(block.receipts[3].events.length, 1);

    // Success: wallet_2 is blacklisted
    block.receipts[4].result.expectBool(true);
  },
});

// Test detect-transfer-restriction
Clarinet.test({
  name: 'Ensure it detects transfer restriction when sender or receipent is blacklisted',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;
    const wallet1Address = wallet_1.address;

    let block = chain.mineBlock([
      Tx.contractCall(
        'stxlink-token',
        'add-principal-to-role',
        [types.uint(4), types.principal(wallet1Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'update-blacklisted',
        [types.principal(wallet_2.address), types.bool(true)],
        wallet1Address
      ),

      Tx.contractCall(
        'stxlink-token',
        'detect-transfer-restriction',
        [types.uint(20), types.principal(wallet_1.address), types.principal(wallet_2.address)],
        wallet1Address
      ),

      Tx.contractCall(
        'stxlink-token',
        'detect-transfer-restriction',
        [types.uint(20), types.principal(deployer.address), types.principal(wallet_1.address)],
        wallet1Address
      ),
    ]);

    // Success: owner account assigns wallet1Address blacklister role
    block.receipts[0].result.expectOk().expectBool(true);
    assertEquals(block.receipts[0].events.length, 1);

    // Success: wallet1Address blacklists wallet_2 address
    block.receipts[1].result.expectOk().expectBool(true);
    assertEquals(block.receipts[1].events.length, 1);

    // Error: detect-transfer-restriction returns u1 = RESTRICTION_BLACKLIST when receiver is wallet_2
    block.receipts[2].result.expectErr().expectUint(1);

    // Success: detect-transfer-restriction returns u0 = RESTRICTION_BLACKLIST when sender and receiver are not blacklisted
    block.receipts[3].result.expectOk().expectUint(0);
  },
});

// Testing transfer
Clarinet.test({
  name: 'Ensure it transfer successfuly when sender and receiver are not restricted',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;
    const wallet1Address = wallet_1.address;
    const minted2kAddress = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6'; // address to which 2k coins are minted initially
    let block = chain.mineBlock([
      Tx.contractCall(
        'stxlink-token',
        'add-principal-to-role',
        [types.uint(4), types.principal(wallet1Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'update-blacklisted',
        [types.principal(wallet_2.address), types.bool(true)],
        wallet1Address
      ),

      Tx.contractCall(
        'stxlink-token',
        'get-balance',
        [types.principal(minted2kAddress)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'transfer',
        [
          types.uint(20),
          types.principal(minted2kAddress),
          types.principal(wallet_2.address),
          types.some('0x54657374696e67204d656d6f'),
        ],
        minted2kAddress
      ),

      Tx.contractCall(
        'stxlink-token',
        'transfer',
        [
          types.uint(20),
          types.principal(minted2kAddress),
          types.principal(wallet1Address),
          types.some('0x54657374696e67204d656d6f'),
        ],
        wallet1Address
      ),

      Tx.contractCall(
        'stxlink-token',
        'transfer',
        [
          types.uint(100),
          types.principal(minted2kAddress),
          types.principal(wallet1Address),
          types.some('0x54657374696e67204d656d6f'),
        ],
        minted2kAddress
      ),
      Tx.contractCall(
        'stxlink-token',
        'get-balance',
        [types.principal(minted2kAddress)],
        minted2kAddress
      ),

      Tx.contractCall(
        'stxlink-token',
        'get-balance',
        [types.principal(wallet1Address)],
        wallet1Address
      ),
    ]);

    // Success: owner account assigns wallet1Address blacklister role
    block.receipts[0].result.expectOk().expectBool(true);
    assertEquals(block.receipts[0].events.length, 1);

    // Success: wallet1Address blacklists wallet_2 address
    block.receipts[1].result.expectOk().expectBool(true);
    assertEquals(block.receipts[1].events.length, 1);

    // balance of minted2kAccount before transfer = 2000
    block.receipts[2].result.expectOk().expectUint(2000);

    // Error: fail transfer receiver is blacklisted (wallet_2)
    block.receipts[3].result.expectErr().expectUint(1);

    // Error: fail transfer originator is not the sender principal
    block.receipts[4].result.expectErr().expectUint(4);

    //Success: Transfer 100 token from minted2kAddress to wallet1Address when all checks passed
    block.receipts[5].result.expectOk().expectBool(true);
    assertEquals(block.receipts[5].events.length, 1);

    // Expect: Balance of minted2kAddress = 1900
    block.receipts[6].result.expectOk().expectUint(1900);

    // Expect: Balance of wallet1Address = 1900
    block.receipts[7].result.expectOk().expectUint(100);
  },
});

// Testing minting and burning
Clarinet.test({
  name: 'Ensure it mint and burn tokens successfully with roles',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;
    const wallet1Address = wallet_1.address;
    const minted2kAddress = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
    let block = chain.mineBlock([
      Tx.contractCall(
        'stxlink-token',
        'add-principal-to-role',
        [types.uint(1), types.principal(wallet1Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'add-principal-to-role',
        [types.uint(2), types.principal(wallet1Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'mint-tokens',
        [types.uint(2000), types.principal(wallet1Address)],
        wallet1Address
      ),
      Tx.contractCall(
        'stxlink-token',
        'get-balance',
        [types.principal(wallet1Address)],
        wallet1Address
      ),

      Tx.contractCall(
        'stxlink-token',
        'burn-tokens',
        [types.uint(2000), types.principal(wallet1Address)],
        wallet1Address
      ),
      Tx.contractCall(
        'stxlink-token',
        'get-balance',
        [types.principal(wallet1Address)],
        wallet1Address
      ),
    ]);

    // Success: owner account assigns wallet1Address minter role
    block.receipts[0].result.expectOk().expectBool(true);
    assertEquals(block.receipts[0].events.length, 1);

    // Success: owner account assigns wallet1Address burner role
    block.receipts[1].result.expectOk().expectBool(true);
    assertEquals(block.receipts[1].events.length, 1);

    // Success: wallet1Address mint 2000 token to wallet1Address
    block.receipts[2].result.expectOk().expectBool(true);
    assertEquals(block.receipts[2].events.length, 2);

    // Expect: Wallet1Address balance = 2000
    block.receipts[3].result.expectOk().expectUint(2000);

    // Success: wallet1Address burn 2000 token from wallet1Address
    block.receipts[4].result.expectOk().expectBool(true);
    assertEquals(block.receipts[4].events.length, 2);

    // Expect: Wallet1Address balance = 0
    block.receipts[5].result.expectOk().expectUint(0);
  },
});

// Testing revoking
Clarinet.test({
  name: 'Ensure it revokes tokens succesfully with REVOKER role',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;
    const wallet1Address = wallet_1.address;
    const minted2kAddress = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
    let block = chain.mineBlock([
      Tx.contractCall(
        'stxlink-token',
        'add-principal-to-role',
        [types.uint(3), types.principal(deployer.address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'add-principal-to-role',
        [types.uint(1), types.principal(wallet1Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'mint-tokens',
        [types.uint(2000), types.principal(wallet1Address)],
        wallet1Address
      ),
      Tx.contractCall(
        'stxlink-token',
        'get-balance',
        [types.principal(wallet1Address)],
        wallet1Address
      ),

      Tx.contractCall(
        'stxlink-token',
        'revoke-tokens',
        [types.uint(2000), types.principal(wallet1Address), types.principal(minted2kAddress)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'get-balance',
        [types.principal(wallet1Address)],
        wallet1Address
      ),

      Tx.contractCall(
        'stxlink-token',
        'get-balance',
        [types.principal(minted2kAddress)],
        minted2kAddress
      ),
    ]);

    // Success: owner account assigns deployer address revoker role
    block.receipts[0].result.expectOk().expectBool(true);
    assertEquals(block.receipts[0].events.length, 1);

    // Success: owner account assigns wallet1Address minter role
    block.receipts[1].result.expectOk().expectBool(true);
    assertEquals(block.receipts[1].events.length, 1);

    // Success: wallet1Address mint 2000 token to wallet1Address
    block.receipts[2].result.expectOk().expectBool(true);
    assertEquals(block.receipts[2].events.length, 2);

    // Expect: Wallet1Address balance = 2000
    block.receipts[3].result.expectOk().expectUint(2000);

    // Success deployer (revoker) revokes 2000 tokens from wallet1Address to minted2kAddress
    block.receipts[4].result.expectOk().expectBool(true);
    assertEquals(block.receipts[4].events.length, 2);

    // Expect: Wallet1Address balance = 0
    block.receipts[5].result.expectOk().expectUint(0);

    // Expect: minted2kAddress balance = 2000
    block.receipts[6].result.expectOk().expectUint(4000);
  },
});

// Testing add and remove all roles
Clarinet.test({
  name: 'Ensure it add and remove address from all roles successfully',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;
    const wallet1Address = wallet_1.address;
    const wallet2Address = wallet_2.address;
    let block = chain.mineBlock([
      // Assign all roles 1 by 1

      Tx.contractCall(
        'stxlink-token',
        'add-principal-to-role',
        [types.uint(0), types.principal(deployer.address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'add-principal-to-role',
        [types.uint(1), types.principal(wallet1Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'add-principal-to-role',
        [types.uint(2), types.principal(wallet1Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'add-principal-to-role',
        [types.uint(3), types.principal(wallet2Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'add-principal-to-role',
        [types.uint(4), types.principal(wallet2Address)],
        deployer.address
      ),

      // Test all roles are succesfully assigned
      Tx.contractCall(
        'stxlink-token',
        'has-role',
        [types.uint(0), types.principal(wallet2Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'has-role',
        [types.uint(0), types.principal(deployer.address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'has-role',
        [types.uint(1), types.principal(wallet1Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'has-role',
        [types.uint(2), types.principal(wallet1Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'has-role',
        [types.uint(3), types.principal(wallet2Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'has-role',
        [types.uint(4), types.principal(wallet2Address)],
        deployer.address
      ),
      // Remove all assigned roles
      Tx.contractCall(
        'stxlink-token',
        'remove-principal-from-role',
        [types.uint(1), types.principal(wallet1Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'remove-principal-from-role',
        [types.uint(2), types.principal(wallet1Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'remove-principal-from-role',
        [types.uint(3), types.principal(wallet2Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'remove-principal-from-role',
        [types.uint(4), types.principal(wallet2Address)],
        deployer.address
      ),
      // Test all roles are removed
      // Test all roles are removed
      // Test all roles are removed
      Tx.contractCall(
        'stxlink-token',
        'has-role',
        [types.uint(1), types.principal(wallet1Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'has-role',
        [types.uint(2), types.principal(wallet1Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'has-role',
        [types.uint(3), types.principal(wallet2Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'has-role',
        [types.uint(4), types.principal(wallet2Address)],
        deployer.address
      ),
    ]);
    // Success: owner account assigns deployer address owner role
    block.receipts[0].result.expectOk().expectBool(true);
    assertEquals(block.receipts[0].events.length, 1);

    // Success: owner account assigns wallet1Address minter role
    block.receipts[1].result.expectOk().expectBool(true);
    assertEquals(block.receipts[1].events.length, 1);

    // Success: owner account assigns wallet1Address burner role
    block.receipts[2].result.expectOk().expectBool(true);
    assertEquals(block.receipts[2].events.length, 1);

    // Success: owner account assigns wallet2Address revoker role
    block.receipts[3].result.expectOk().expectBool(true);
    assertEquals(block.receipts[3].events.length, 1);

    // Success: owner account assigns wallet2Address blacklister role
    block.receipts[4].result.expectOk().expectBool(true);
    assertEquals(block.receipts[4].events.length, 1);

    // Error : expect wallet1Address to be owner
    block.receipts[5].result.expectBool(false);

    // Expect : deployer has owner-role
    block.receipts[6].result.expectBool(true);

    // Expect : wallet1Address has minter-role
    block.receipts[7].result.expectBool(true);

    // Expect : wallet1Address has burner-role
    block.receipts[8].result.expectBool(true);

    // Expect : wallet2Address has revoker-role
    block.receipts[9].result.expectBool(true);

    // Expect : wallet2Address has blacklister-role
    block.receipts[10].result.expectBool(true);

    // Success: owner account removes wallet1Address from minter role
    block.receipts[11].result.expectOk().expectBool(true);
    assertEquals(block.receipts[11].events.length, 1);

    // Success: owner account removes wallet1Address from burner role
    block.receipts[12].result.expectOk().expectBool(true);
    assertEquals(block.receipts[12].events.length, 1);

    // Success: owner account removes wallet2Address from revoker role
    block.receipts[13].result.expectOk().expectBool(true);
    assertEquals(block.receipts[13].events.length, 1);

    // Success: owner account removes wallet2Address from blacklister role
    block.receipts[14].result.expectOk().expectBool(true);
    assertEquals(block.receipts[14].events.length, 1);

    // Expect : wallet1Address not to have minter-role
    block.receipts[15].result.expectBool(false);

    // Expect : wallet1Address not to have burner-role
    block.receipts[16].result.expectBool(false);

    // Expect : wallet2Address not to have revoker-role
    block.receipts[17].result.expectBool(false);

    // Expect : wallet2Address not to have blacklister-role
    block.receipts[18].result.expectBool(false);
  },
});
// Test set and get token uri
Clarinet.test({
  name: 'Ensure it sets and gets tokens uri',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;
    const wallet1Address = wallet_1.address;
    let block = chain.mineBlock([
      Tx.contractCall(
        'stxlink-token',
        'set-token-uri',
        [types.utf8('Testing URI')],
        deployer.address
      ),
      Tx.contractCall('stxlink-token', 'get-token-uri', [], wallet1Address),
    ]);

    // Success: Set Token URI
    block.receipts[0].result.expectOk().expectBool(true);
    assertEquals(block.receipts[0].events.length, 1);

    // Success: Get Token URI
    block.receipts[1].result.expectOk();
  },
});

Clarinet.test({
  name: 'Ensure requests charge minnimum payment to orignator',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;

    const wallet1Address = wallet_1.address;
    const directRequestParams = [
      '0x3334346664393436386561363437623838633530336461633830383263306134',
      '0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145',
      '0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d',
      types.principal(deployer.address + '.oracle'),
      types.principal(deployer.address + '.direct-request'),
      types.principal(deployer.address + '.direct-request'),
    ];

    let block = chain.mineBlock([
      // Token Initialization
      Tx.contractCall(
        'stxlink-token',
        'add-principal-to-role',
        [types.uint(1), types.principal(wallet1Address)],
        deployer.address
      ),
      Tx.contractCall(
        'stxlink-token',
        'mint-tokens',
        [types.uint(2000), types.principal(wallet1Address)],
        wallet1Address
      ),
      Tx.contractCall(
        'stxlink-token',
        'get-balance',
        [types.principal(wallet1Address)],
        deployer.address
      ),
      Tx.contractCall('direct-request', 'create-request', directRequestParams, wallet1Address),
      Tx.contractCall(
        'stxlink-token',
        'get-balance',
        [types.principal(deployer.address + '.oracle')],
        wallet1Address
      ),
      Tx.contractCall(
        'stxlink-token',
        'get-balance',
        [types.principal(wallet1Address)],
        deployer.address
      ),
    ]);

    // Success: owner account assigns wallet1Address minter role
    block.receipts[0].result.expectOk().expectBool(true);
    assertEquals(block.receipts[0].events.length, 1);

    // Success: wallet1Address mint 2000 token to wallet1Address
    block.receipts[1].result.expectOk().expectBool(true);
    assertEquals(block.receipts[1].events.length, 2);

    // Expect: Wallet1Address balance = 2000
    block.receipts[2].result.expectOk().expectUint(2000);

    // Success: initiate direct request and emit events (cost 1 stx-link)
    block.receipts[3].result.expectOk().expectBool(true);
    assertEquals(block.receipts[3].events.length, 2);

    // Expect: oracle to have balance 1 stx-link (for serving previous request)
    block.receipts[4].result.expectOk().expectUint(1);

    // Expect: requester account wallet1Address to have balance = 1999 (1 stx-link paid for request)
    block.receipts[5].result.expectOk().expectUint(1999);
  },
});
Clarinet.test({
  name: 'Ensure transfer-and-call success flow',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;
    const minted2kAddress = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
    const wallet1Address = wallet_1.address;

    const oracleContractAddress = types.principal(deployer.address + '.oracle');
    const directRequestContractAddress = types.principal(deployer.address + '.direct-request');
    const transfer_and_call_params = [
      '0x3334346664393436386561363437623838633530336461633830383263306134',
      '0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145',
      '0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d',
      oracleContractAddress,
      directRequestContractAddress,
      directRequestContractAddress,
    ];

    let block = chain.mineBlock([
      Tx.contractCall(
        'stxlink-token',
        'get-balance',
        [types.principal(minted2kAddress)],
        minted2kAddress
      ),
      Tx.contractCall(
        'stxlink-token',
        'transfer-and-call',
        transfer_and_call_params,
        minted2kAddress
      ),
      Tx.contractCall(
        'stxlink-token',
        'get-balance',
        [types.principal(deployer.address + '.oracle')],
        wallet1Address
      ),
      Tx.contractCall(
        'stxlink-token',
        'get-balance',
        [types.principal(minted2kAddress)],
        deployer.address
      ),
    ]);

    // Expect minted2kAddress to have 2000 balance  initially before job request
    block.receipts[0].result.expectOk().expectUint(2000);

    // Success: minted2kAddress transfer-and-call function and emit 2 events ftTransferEvent and contractEvent
    block.receipts[1].result.expectOk();
    assertEquals(block.receipts[1].events.length, 2);

    const events = block.receipts[1].events;
    const [ftTransferEvent, contractEvent] = events;
    const { sender, recipient, amount, asset_identifier } = ftTransferEvent.ft_transfer_event;
    const { topic, contract_identifier } = contractEvent.contract_event;

    asset_identifier.expectPrincipal(
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.stxlink-token::stxlink-token'
    );
    sender.expectPrincipal('STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6');
    recipient.expectPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.oracle');
    amount.expectInt(1);
    assertEquals(topic, 'print');
    assertEquals(contract_identifier, 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.oracle');

    // Expect: Oracle balance to be  = 1 after fulfilling a job request
    block.receipts[2].result.expectOk().expectUint(1);

    // Expect: requester account minted2kAddress to have balance = 1999 (1 stx-link paid for request)
    block.receipts[3].result.expectOk().expectUint(1999);
  },
});
Clarinet.test({
  name: 'Ensure transfer-and-call failure when not enough balance',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;
    const minted2kAddress = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
    const wallet1Address = wallet_1.address;

    const oracleContractAddress = types.principal(deployer.address + '.oracle');
    const directRequestContractAddress = types.principal(deployer.address + '.direct-request');
    const transfer_and_call_params = [
      '0x3334346664393436386561363437623838633530336461633830383263306134',
      '0x5354314854425644334a47394330354a3748424a5448475230474757374b585732384d354a53385145',
      '0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d',
      oracleContractAddress,
      directRequestContractAddress,
      directRequestContractAddress,
    ];

    let block = chain.mineBlock([
      Tx.contractCall(
        'stxlink-token',
        'get-balance',
        [types.principal(wallet1Address)],
        wallet1Address
      ),
      Tx.contractCall(
        'stxlink-token',
        'transfer-and-call',
        transfer_and_call_params,
        wallet1Address
      ),
      Tx.contractCall(
        'stxlink-token',
        'get-balance',
        [types.principal(deployer.address + '.oracle')],
        wallet1Address
      ),
      Tx.contractCall(
        'stxlink-token',
        'get-balance',
        [types.principal(wallet1Address)],
        deployer.address
      ),
    ]);

    // Expect wallet1Address to have 0 balance  initially before job request
    block.receipts[0].result.expectOk().expectUint(0);

    // Failure: Return ok for succesfully running transfer-fail and emit no ftTransfer or contract event
    block.receipts[1].result.expectOk();
    assertEquals(block.receipts[1].events.length, 0);

    // Expect: Oracle balance to be  = 0 since request was not a success
    block.receipts[2].result.expectOk().expectUint(0);

    // Expect: requester account wallet1Address to have balance = 0 unchanged after unsuccessful request
    block.receipts[3].result.expectOk().expectUint(0);
  },
});
