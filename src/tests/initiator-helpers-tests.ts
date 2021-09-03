import {
  validatePayment,
  getJobSpecMinPayment,
  getChainlinkClientSessionCookie,
} from '../initiator-helpers';

test('Returns True on payment > Jobcost', () => {
  const payment = BigInt(20);
  const jobcost = BigInt(10);
  const result = validatePayment(payment, jobcost);
  expect(result).resolves.toBe(true);
});

test('Returns True on payment = Jobcost', () => {
  const payment = BigInt(10);
  const jobcost = BigInt(10);
  const result = validatePayment(payment, jobcost);
  expect(result).resolves.toBe(true);
});

test('Returns False on payment < jobcost', () => {
  const payment = BigInt(10);
  const jobcost = BigInt(20);
  const result = validatePayment(payment, jobcost);
  expect(result).resolves.toBe(false);
});

test('Throws error on invalid job id', async () => {
  const jobID = 'dummy';
  const cookie = await getChainlinkClientSessionCookie();
  await expect(getJobSpecMinPayment(jobID, cookie)).rejects.toThrowError(
    'Invalid Job ID or Cookie While Fetching JobSpec MinPayment'
  );
});

test('Throws error on invalid cookie', async () => {
  const jobID = process.env.CHAINLINK_GET_JOB_ID || 'c7c16681f7704af4a247aa7b65064c4d';
  const cookie = 'invalidcookie';
  await expect(getJobSpecMinPayment(jobID, cookie)).rejects.toThrowError(
    'Invalid Job ID or Cookie While Fetching JobSpec MinPayment'
  );
});

test('Fetches job cost/min payment with corrrect jobID and cookie', async () => {
  const jobID = process.env.CHAINLINK_GET_JOB_ID || 'c7c16681f7704af4a247aa7b65064c4d';
  const cookie = await getChainlinkClientSessionCookie();
  const result = getJobSpecMinPayment(jobID, cookie);
  expect(result).resolves.toBeDefined();
});



test('Fetches cookie with valid credentials', async () => {
  process.env.CHAINLINK_COOKIE= undefined
  const cookie = await getChainlinkClientSessionCookie();
  expect(cookie).toBeDefined();
  expect(typeof cookie).toBe("string");
  // expect(typeof cookie).toBe("string")
  // afterAll(() => {
  //   process.env.CHAINLINK_EMAIL = 'test@tintash.com';
  //   process.env.CHAINLINK_PASSWORD = '12345678'
  // });
});

test('Error : While Fetching cookie with invalid credentials', async () => {
  process.env.CHAINLINK_EMAIL = '';
  process.env.CHAINLINK_PASSWORD = ''
  process.env.CHAINLINK_COOKIE= undefined
  await expect(getChainlinkClientSessionCookie()).rejects.toThrow();
  process.env.CHAINLINK_EMAIL = 'test@tintash.com';
  process.env.CHAINLINK_PASSWORD = '12345678';
});