export const MockRequests = [
  {
    id: 0,
    type: 'get',
    'job-id': process.env.CHAINLINK_GET_JOB_ID,
    params: {
      get: 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD',
      path: 'USD',
    },
  },
  {
    id: 1,
    type: 'get',
    'job-id': process.env.CHAINLINK_GET_JOB_ID,
    params: {
      get: 'https://min-api.cryptocompare.com/data/price?fsym=STX&tsyms=USD',
      path: 'USD',
    },
  },
  {
    id: 2,
    type: 'post',
    'job-id': process.env.CHAINLINK_POST_JOB_ID,
    params: {
      post: 'https://reqres.in/api/register',
      body: '{\n    "email": "eve.holt@reqres.in",\n    "password": "pistol"\n}',
      path: 'id',
    },
  },
  {
    id: 3,
    type: 'post',
    'job-id': process.env.CHAINLINK_POST_JOB_ID,
    params: {
      post: 'https://stacks-node-api.testnet.stacks.co/rosetta/v1/network/options',
      body: '{"network_identifier": {\n            "blockchain": "stacks",\n            "network": "testnet"\n    }\n}',
      path: 'version.rosetta_version',
    },
  },
];
