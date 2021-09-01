import BigNum from 'bn.js';

async function getChainlinkClientSessionCookie(): Promise<string> {
  console.log('here: ', process.env.CHAINLINK_EMAIL, process.env.CHAINLINK_PASSWORD);
  return fetch('http://localhost:6688/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: process.env.CHAINLINK_EMAIL,
      password: process.env.CHAINLINK_PASSWORD,
    }),
  }).then(response => String(response.headers.get('set-cookie')).replace(',', ';'));
}

export async function getJobSpecMinPayment(jobId: string): Promise<bigint> {
  if (process.env.CHAINLINK_COOKIE === undefined || process.env.CHAINLINK_COOKIE || '') {
    process.env['CHAINLINK_COOKIE'] = await getChainlinkClientSessionCookie();
  }
  console.log(`http://localhost:6688/v2/specs/${jobId}`);
  return fetch(`http://localhost:6688/v2/specs/${jobId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      cookie: String(process.env.CHAINLINK_COOKIE),
    },
  })
    .then(response => response.json())
    .then(res => res.data.attributes.minPayment);
}

export async function validatePayment(payment: bigint, cost: bigint): Promise<boolean>{
  return (payment >= cost)
}