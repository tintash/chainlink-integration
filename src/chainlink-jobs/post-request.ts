export const postRequestJob = {
  name: 'post-request',
  initiators: [
    {
      type: 'external',
      params: {
        name: process.env.CHAINLINK_EI_NAME,
        body: {},
      },
    },
  ],
  tasks: [
    {
      type: 'httppost',
    },
    {
      type: 'jsonparse',
    },
    {
      type: process.env.CHAINLINK_BRIDGE_NAME,
    },
  ],
  minPayment: '1',
};
