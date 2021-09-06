import fetch from 'node-fetch';

export async function getChainlinkClientSessionCookie(): Promise<string> {
  try {
    let cookie_array = String(process.env.CHAINLINK_COOKIE).split(';');
    const cookie_expires_at = new Date(
      String(cookie_array.find(x => x.match('Expires='))).replace('Expires=', '')
    );

    if (
      process.env.CHAINLINK_COOKIE === undefined ||
      process.env.CHAINLINK_COOKIE === '' ||
      cookie_expires_at.getTime() < Date.now()
    ) {
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
  } catch (error: any) {
    throw new Error(`{ error: chainlink login credentials not provided, msg: ${error.message} }`);
  }
  return String(process.env.CHAINLINK_COOKIE);
}

export async function getJobSpecMinPayment(jobId: string, cookie: string): Promise<bigint> {
  try {
    return fetch(`http://localhost:6688/v2/specs/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookie,
      },
    })
      .then(response => response.json())
      .then(res => {
        if(!res.data) throw new Error('Invalid Job ID or Cookie While Fetching JobSpec MinPayment')
        else if(res.data.id == jobId && !res.data.attributes.minPayment) return 1
        return res.data.attributes.minPayment;
      });
  } catch (error: any) {
    throw new Error(`{ error: Failed Fetching JobSpec MinPayment, msg ${error.message} }`);
  }
}

export async function validatePayment(payment: bigint, cost: bigint): Promise<boolean> {
  return payment >= cost;
}
