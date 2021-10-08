export const getRequestJob = {
  name: 'get-request',
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
      type: 'httpget',
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
