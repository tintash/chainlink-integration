
import { App } from "../app";
import supertest from 'supertest';
import * as EventHelper from '../event-helpers';


let apiServer = App;

describe('initiator tests', () => {

    test('initiator test', async () => {
        const msg = {
            block_hash: '0x488daab312c0be57555fcb91440a09ef72dee17a17b671c08bfe7437b66f1537',
            block_height: 40,
            burn_block_hash: '0x54bb1640d3a827800fb042c6676a06962f94eb72e2ef31ccd32326d870797d4b',
            burn_block_height: 41,
            burn_block_time: 1625672763,
            events: [
              {
                committed: true,
                contract_event: {
                    contract_identifier: 'ST248M2G9DF9G5CX42C31DG04B3H47VJK6W73JDNC.oracle',
                    raw_value: '0x0c0000000b0863616c6c6261636b061a888a0a096bd302b3a4130616c00458e243ee53370e6469726563742d72657175657374046461746102000000ae3078376232323637363537343232336132323638373437343730373333613266326636643639366532643631373036393265363337323739373037343666363336663664373036313732363532653633366636643266363436313734363132663730373236393633363533663636373337393664336434353534343832363734373337393664373333643535353334343232326332323730363137343638323233613232353535333434323237640c646174612d76657273696f6e01000000000000000000000000000000000a65787069726174696f6e01000000000000000000000000000000120a6861736865642d76616c020000002095c47a2b03dc74f3502baa8988b2f3af3ddf9afe77d893499a0719c52134bebb056e6f6e63650100000000000000000000000000000000077061796d656e74010000000000000000000000000000012c0a726571756573742d6964020000002095c47a2b03dc74f3502baa8988b2f3af3ddf9afe77d893499a0719c52134bebb0673656e646572051a888a0a096bd302b3a4130616c00458e243ee533707737065632d696402000000423078333333343334363636343339333433363338363536313336333433373632333833383633333533303333363436313633333833303338333236333330363133340e746f74616c2d72657175657374730100000000000000000000000000000000',
                    topic: 'print',
                    value: {"Tuple":{"data_map":{"callback":{"Principal":{"Contract":{"issuer":[26,[136,138,10,9,107,211,2,179,164,19,6,22,192,4,88,226,67,238,83,55]],"name":"direct-request"}}},"data":{"Sequence":{"Buffer":{"data":[48,120,55,98,50,50,54,55,54,53,55,52,50,50,51,97,50,50,54,56,55,52,55,52,55,48,55,51,51,97,50,102,50,102,54,100,54,57,54,101,50,100,54,49,55,48,54,57,50,101,54,51,55,50,55,57,55,48,55,52,54,102,54,51,54,102,54,100,55,48,54,49,55,50,54,53,50,101,54,51,54,102,54,100,50,102,54,52,54,49,55,52,54,49,50,102,55,48,55,50,54,57,54,51,54,53,51,102,54,54,55,51,55,57,54,100,51,100,52,53,53,52,52,56,50,54,55,52,55,51,55,57,54,100,55,51,51,100,53,53,53,51,52,52,50,50,50,99,50,50,55,48,54,49,55,52,54,56,50,50,51,97,50,50,53,53,53,51,52,52,50,50,55,100]}}},"data-version":{"UInt":0},"expiration":{"UInt":389},"hashed-val":{"Sequence":{"Buffer":{"data":[20,242,99,40,130,37,4,139,31,80,210,182,109,180,138,167,46,65,99,209,186,115,187,18,199,78,28,56,227,162,109,171]}}},"nonce":{"UInt":0},"payment":{"UInt":300},"request-id":{"Sequence":{"Buffer":{"data":[20,242,99,40,130,37,4,139,31,80,210,182,109,180,138,167,46,65,99,209,186,115,187,18,199,78,28,56,227,162,109,171]}}},"sender":{"Principal":{"Standard":[26,[136,138,10,9,107,211,2,179,164,19,6,22,192,4,88,226,67,238,83,55]]}},"spec-id":{"Sequence":{"Buffer":{"data":[48,120,51,51,51,52,51,52,54,54,54,52,51,57,51,52,51,54,51,56,54,53,54,49,51,54,51,52,51,55,54,50,51,56,51,56,54,51,51,53,51,48,51,51,54,52,54,49,54,51,51,56,51,48,51,56,51,50,54,51,51,48,54,49,51,52]}}},"total-requests":{"UInt":0}},"type_signature":{"type_map":{"callback":"PrincipalType","data":{"SequenceType":{"BufferType":174}},"data-version":"UIntType","expiration":"UIntType","hashed-val":{"SequenceType":{"BufferType":32}},"nonce":"UIntType","payment":"UIntType","request-id":{"SequenceType":{"BufferType":32}},"sender":"PrincipalType","spec-id":{"SequenceType":{"BufferType":66}},"total-requests":"UIntType"}}}}
                },
                event_index: 1,
                txid: '0xbd89b65c47e047e7186f512c0cc7d0d4846e840a66beedfb6276c1e527ad4249',
                type: 'contract_event'
              },
              {
                committed: true,
                event_index: 0,
                stx_transfer_event: {
                    amount: '300',
                    recipient: 'ST3X3TP269TNNGT3EQKF3JY1TK2M343FMZ8BNMV0G',
                    sender: 'ST248M2G9DF9G5CX42C31DG04B3H47VJK6W73JDNC'
                },
                txid: '0xbd89b65c47e047e7186f512c0cc7d0d4846e840a66beedfb6276c1e527ad4249',
                type: 'stx_transfer_event'
              }
            ],
            index_block_hash: '0x97376fd102780233029e974e39a357064622ac1d9141f301f4936bfbfe0ebe76',
            matured_miner_rewards: [],
            miner_txid: '0x0000000000000000000000000000000000000000000000000000000000000000',
            parent_block_hash: '0xbe54886561b23cd175e32c865786eb226097d7949103417c62c0d18ece74b43d',
            parent_index_block_hash: '0xcce1adb5a33cd4383a00f390c9d57e702c618ab5341490a54030415c24077a3b',
            parent_microblock: '0x0000000000000000000000000000000000000000000000000000000000000000',
            transactions: [
              {
                contract_abi: null,
                execution_cost: {
                    "read_count": 0,
                    "read_length": 0,
                    "runtime": 0,
                    "write_count": 0,
                    "write_length": 0
                },
                raw_result: '0x0703',
                raw_tx: '0x808000000004005c4e86c72f84b85d62af16a28d03ea88b852cac4000000000000002700000000000000000100edfb19d6e41d77eb800b9176c62d02c81f202d4950db3ce8ccac803276279adb1766c5b32bfb6333d60691c3d26c1600c8a23840cb2a93f63ce1d68ec4e64707010200000000040000000000000000000000000000000000000000000000000000000000000000',
                status: 'success',
                tx_index: 0,
                txid: '0x7b3686a27a1c53cc3a8927d999ee282f5144f37e8493196ff2f853c23f977031'
              },
              {
                contract_abi: null,
                execution_cost: {
                    "read_count": 10,
                    "read_length": 7407,
                    "runtime": 12936000,
                    "write_count": 2,
                    "write_length": 108
                },
                raw_result: '0x0703',
                raw_tx: '0x80800000000400888a0a096bd302b3a4130616c00458e243ee5337000000000000000200000000000001e70000192533c5d6826ebc2c4df5132abdba046dbe59818d3f63c4b832b9720254a383529c4bfc86dc2fdc3498ada005f53bfe56f979054844e0b70832c3ac4e7bba7b01020000000100021a888a0a096bd302b3a4130616c00458e243ee533701000000000000012c021a888a0a096bd302b3a4130616c00458e243ee53370e6469726563742d726571756573740b726571756573742d61706900000003020000004230783333333433343636363433393334333633383635363133363334333736323338333836333335333033333634363136333338333033383332363333303631333402000000ae307837623232363736353734323233613232363837343734373037333361326632663664363936653264363137303639326536333732373937303734366636333666366437303631373236353265363336663664326636343631373436313266373037323639363336353366363637333739366433643435353434383236373437333739366437333364353535333434323232633232373036313734363832323361323235353533343432323764061a888a0a096bd302b3a4130616c00458e243ee53370e6469726563742d72657175657374',
                status: 'success',
                tx_index: 1,
                txid: '0xbd89b65c47e047e7186f512c0cc7d0d4846e840a66beedfb6276c1e527ad4249'
              }
            ]
        }
        const expected = {}
        Object.defineProperty(EventHelper, 'executeChainlinkInitiator', {
            value: jest.fn().mockImplementation(() => expected),
        });

        const query = await supertest(apiServer).post('/new_block').send(msg);
        expect(query.status).toBe(200);
    });


    test('error without message', async () => {
        const query = await supertest(apiServer).post('/new_block');
        expect(query.status).toBe(500);
    });

    
});



