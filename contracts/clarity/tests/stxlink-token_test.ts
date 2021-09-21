// @ts-ignore
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.13.0/index.ts';
// @ts-ignore
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
// Test Contract Initialization State
Clarinet.test({
  name: 'stxlink-token: returns the correct values for read only fns at initialization',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    let wallet_2 = accounts.get('wallet_2')!;
    let wallet_3 = accounts.get('wallet_3')!;
    // Test total supply of stx-link initially minted = 2000
    var call = await chain.callReadOnlyFn(
      'stxlink-token',
      'get-total-supply',
      [],
      deployer.address
    );
    call.result.expectOk().expectUint(2000);
    // Test balance of account 2000 tokens are minted to
    call = await chain.callReadOnlyFn(
      'stxlink-token',
      'get-balance',
      [types.principal('STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6')],
      wallet_2.address
    );
    call.result.expectOk().expectUint(2000);
    // Test name symbol decimals
    call = await chain.callReadOnlyFn('stxlink-token', 'get-name', [], wallet_2.address);
    call.result.expectOk().expectAscii('STXLINK');

    call = await chain.callReadOnlyFn('stxlink-token', 'get-symbol', [], wallet_2.address);
    call.result.expectOk().expectAscii('SL');

    call = await chain.callReadOnlyFn('stxlink-token', 'get-decimals', [], deployer.address);
    call.result.expectOk().expectUint(1);
    // Test owner and minter roles assigned at initialization
    call = await chain.callReadOnlyFn(
      'stxlink-token',
      'has-role',
      [types.uint(0), types.principal(deployer.address)],
      deployer.address
    );
    call.result.expectBool(true);

    call = await chain.callReadOnlyFn(
      'stxlink-token',
      'has-role',
      [types.uint(1), types.principal(deployer.address)],
      deployer.address
    );
    call.result.expectBool(true);

    /** Test remaining read only functions
     * is-blacklisted => Test if an account is blacklisted
     * detect-transfer-restriction => Test if sender or receipent is blacklisted
     * message-for-restriction => Test message to show for restricted account.
     */
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
/** Testing Capabilities in following order
 *  Blacklisting
 *  detect-transfer-restriction
 *  Transfer tokens
 *  Mint and Burn tokens
 *  Revoke tokens
 *  adding and removing roles
 *  get and set token uri
 * */

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
        // Test before adding role - Error case u403
        'stxlink-token',
        'update-blacklisted',
        [types.principal(wallet1Address), types.bool(true)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'add-principal-to-role', // add BlackLister role without owner account - Error case u403
        [types.uint(4), types.principal(wallet1Address)],
        wallet1Address
      ),

      Tx.contractCall(
        'stxlink-token',
        'add-principal-to-role', // Add Blacklister roles  with owner account - success case
        [types.uint(4), types.principal(wallet1Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'update-blacklisted', // Test after adding role - success case
        [types.principal(wallet_2.address), types.bool(true)],
        wallet1Address
      ),

      Tx.contractCall(
        'stxlink-token',
        'is-blacklisted', // Test account successfully blacklisted
        [types.principal(wallet_2.address)],
        wallet1Address
      ),
      //   Tx.contractCall('stxlink-token'),
    ]);

    block.receipts[0].result.expectErr().expectUint(403);

    block.receipts[1].result.expectErr().expectUint(403);

    block.receipts[2].result.expectOk().expectBool(true);
    assertEquals(block.receipts[2].events.length, 1);

    block.receipts[3].result.expectOk().expectBool(true);
    assertEquals(block.receipts[3].events.length, 1);

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
        'add-principal-to-role', // Add Blacklister roles
        [types.uint(4), types.principal(wallet1Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'update-blacklisted', // Blacklist wallet_2 address
        [types.principal(wallet_2.address), types.bool(true)],
        wallet1Address
      ),

      Tx.contractCall(
        'stxlink-token',
        'detect-transfer-restriction', // detect transfer restriction with wallet_2 (blacklisted) receiver
        [types.uint(20), types.principal(wallet_1.address), types.principal(wallet_2.address)],
        wallet1Address
      ),

      Tx.contractCall(
        'stxlink-token',
        'detect-transfer-restriction', // detect transfer restriction with both sender and receiver not blacklisted
        [types.uint(20), types.principal(deployer.address), types.principal(wallet_1.address)],
        wallet1Address
      ),
    ]);

    block.receipts[0].result.expectOk().expectBool(true);
    assertEquals(block.receipts[0].events.length, 1);

    block.receipts[1].result.expectOk().expectBool(true);
    assertEquals(block.receipts[1].events.length, 1);

    block.receipts[2].result.expectErr().expectUint(1);

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
    const minted2kAddress = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6'; // account to which 2k coins are minted initially
    let block = chain.mineBlock([
      Tx.contractCall(
        'stxlink-token',
        'add-principal-to-role', // assign wallet_1 blacklister role
        [types.uint(4), types.principal(wallet1Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'update-blacklisted', // blacklist wallet_2
        [types.principal(wallet_2.address), types.bool(true)],
        wallet1Address
      ),

      Tx.contractCall(
        'stxlink-token',
        'get-balance', // Check balance of minted2kAccount before transfer
        [types.principal(minted2kAddress)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'transfer', // Test transfer when receiver is blacklisted (wallet_2) - error case
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
        'transfer', // Test transfer with account having no balance and none is blacklisted - error case 2
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
        'transfer', // Test transfer when both accounts are not blacklisted and sender has balance - success case
        [
          types.uint(100),
          types.principal(minted2kAddress),
          types.principal(wallet1Address),
          types.some('0x54657374696e67204d656d6f'),
        ],
        minted2kAddress
      ),
      // Test balances after transfer
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

    block.receipts[0].result.expectOk().expectBool(true);
    assertEquals(block.receipts[0].events.length, 1);

    block.receipts[1].result.expectOk().expectBool(true);
    assertEquals(block.receipts[1].events.length, 1);

    block.receipts[2].result.expectOk().expectUint(2000);

    block.receipts[3].result.expectErr().expectUint(1);

    block.receipts[4].result.expectErr().expectUint(4);

    block.receipts[5].result.expectOk().expectBool(true);
    assertEquals(block.receipts[5].events.length, 1);

    block.receipts[6].result.expectOk().expectUint(1900);
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
        'add-principal-to-role', // Assign minter role to wallet_1
        [types.uint(1), types.principal(wallet1Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'add-principal-to-role', // Assign burner role to wallet_1
        [types.uint(2), types.principal(wallet1Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'mint-tokens', // mint tokens
        [types.uint(2000), types.principal(wallet1Address)],
        wallet1Address
      ),
      Tx.contractCall(
        'stxlink-token',
        'get-balance', // get balance after mint = minted tokens
        [types.principal(wallet1Address)],
        wallet1Address
      ),

      Tx.contractCall(
        'stxlink-token',
        'burn-tokens', // burn all minted tokens
        [types.uint(2000), types.principal(wallet1Address)],
        wallet1Address
      ),
      Tx.contractCall(
        'stxlink-token',
        'get-balance', // test balance after burning all minted coins = 0
        [types.principal(wallet1Address)],
        wallet1Address
      ),
    ]);

    block.receipts[0].result.expectOk().expectBool(true);
    assertEquals(block.receipts[0].events.length, 1);

    block.receipts[1].result.expectOk().expectBool(true);
    assertEquals(block.receipts[1].events.length, 1);

    block.receipts[2].result.expectOk().expectBool(true);
    assertEquals(block.receipts[2].events.length, 2);

    block.receipts[3].result.expectOk().expectUint(2000);

    block.receipts[4].result.expectOk().expectBool(true);
    assertEquals(block.receipts[4].events.length, 2);

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
        'stxlink-token', // Assign revoker role to deployer
        'add-principal-to-role',
        [types.uint(3), types.principal(deployer.address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'add-principal-to-role', // Assign revoker role to wallet_1
        [types.uint(1), types.principal(wallet1Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'mint-tokens', // mint
        [types.uint(2000), types.principal(wallet1Address)],
        wallet1Address
      ),
      Tx.contractCall(
        'stxlink-token',
        'get-balance', // Test balance after mint
        [types.principal(wallet1Address)],
        wallet1Address
      ),

      Tx.contractCall(
        'stxlink-token',
        'revoke-tokens', // revoke from wallet_1 to minted2kAddress
        [types.uint(2000), types.principal(wallet1Address), types.principal(minted2kAddress)],
        deployer.address
      ),

      // Test balances of both revoke-from and revoke-to accounts after revoke
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

    block.receipts[0].result.expectOk().expectBool(true);
    assertEquals(block.receipts[0].events.length, 1);

    block.receipts[1].result.expectOk().expectBool(true);
    assertEquals(block.receipts[1].events.length, 1);

    block.receipts[2].result.expectOk().expectBool(true);
    assertEquals(block.receipts[2].events.length, 2);

    block.receipts[3].result.expectOk().expectUint(2000);

    block.receipts[4].result.expectOk().expectBool(true);
    assertEquals(block.receipts[4].events.length, 2);

    block.receipts[5].result.expectOk().expectUint(0);

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
        'add-principal-to-role',        // owner = deployer
        [types.uint(0), types.principal(deployer.address)], 
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'add-principal-to-role',        // minter = wallet_1
        [types.uint(1), types.principal(wallet1Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'add-principal-to-role',        // burner = wallet_1
        [types.uint(2), types.principal(wallet1Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'add-principal-to-role',        // revoker = wallet_2
        [types.uint(3), types.principal(wallet2Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'add-principal-to-role',        // blacklister = wallet_2
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
        // Remove all assigned roles 1 by 1 except owner
      Tx.contractCall(
        'stxlink-token',
        'remove-principal-from-role',       //remove wallet_1 from minter
        [types.uint(1), types.principal(wallet1Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'remove-principal-from-role',       //remove wallet_1 from burner
        [types.uint(2), types.principal(wallet1Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'remove-principal-from-role',       //remove wallet_2 from revoker
        [types.uint(3), types.principal(wallet2Address)],
        deployer.address
      ),

      Tx.contractCall(
        'stxlink-token',
        'remove-principal-from-role',       //remove wallet_2 from blacklister
        [types.uint(4), types.principal(wallet2Address)],
        deployer.address
      ),
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

    block.receipts[0].result.expectOk().expectBool(true);
    assertEquals(block.receipts[0].events.length, 1);

    block.receipts[1].result.expectOk().expectBool(true);
    assertEquals(block.receipts[1].events.length, 1);

    block.receipts[2].result.expectOk().expectBool(true);
    assertEquals(block.receipts[2].events.length, 1);

    block.receipts[3].result.expectOk().expectBool(true);
    assertEquals(block.receipts[3].events.length, 1);

    block.receipts[4].result.expectOk().expectBool(true);
    assertEquals(block.receipts[4].events.length, 1);

    block.receipts[5].result.expectBool(false);

    block.receipts[6].result.expectBool(true);

    block.receipts[7].result.expectBool(true);

    block.receipts[8].result.expectBool(true);

    block.receipts[9].result.expectBool(true);

    block.receipts[10].result.expectBool(true);

    block.receipts[11].result.expectOk().expectBool(true);
    assertEquals(block.receipts[11].events.length, 1);

    block.receipts[12].result.expectOk().expectBool(true);
    assertEquals(block.receipts[12].events.length, 1);

    block.receipts[13].result.expectOk().expectBool(true);
    assertEquals(block.receipts[13].events.length, 1);

    block.receipts[14].result.expectOk().expectBool(true);
    assertEquals(block.receipts[14].events.length, 1);

    block.receipts[15].result.expectBool(false);

    block.receipts[16].result.expectBool(false);

    block.receipts[17].result.expectBool(false);

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
        'set-token-uri', // set
        [types.utf8('Testing URI')],
        deployer.address
      ),
      Tx.contractCall(
        'stxlink-token',
        'get-token-uri', // get
        [],
        wallet1Address
      ),
    ]);

    block.receipts[0].result.expectOk().expectBool(true);
    assertEquals(block.receipts[0].events.length, 1);

    block.receipts[1].result.expectOk();
  },
});

Clarinet.test({
  name: 'Ensure that <...>',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;

    const wallet1Address = wallet_1.address; // Initial Owner
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

    block.receipts[0].result.expectOk().expectBool(true);
    assertEquals(block.receipts[0].events.length, 1);

    block.receipts[1].result.expectOk().expectBool(true);
    assertEquals(block.receipts[1].events.length, 2);

    block.receipts[2].result.expectOk().expectUint(2000);

    block.receipts[3].result.expectOk().expectBool(true);
    assertEquals(block.receipts[3].events.length, 2);

    block.receipts[4].result.expectOk().expectUint(1);

    block.receipts[5].result.expectOk().expectUint(1999);
  },
});
