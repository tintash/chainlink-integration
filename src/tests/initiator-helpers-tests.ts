import { validatePayment, getJobSpecMinPayment } from '../initiator-helpers';

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
  const param = 'dummy';
  await expect(getJobSpecMinPayment(param)).rejects.toThrowError(
    'Cannot read property \'attributes\' of undefined'
  );
});


test('successfully fetches minnimum job payment for valid jobID', async () => {
  const jobID = process.env.TEST_JOBID || '4e6a6f71d5b9417591446b7163985951';
  const result = await getJobSpecMinPayment(jobID)
  expect(result).toBeDefined()
  expect(typeof result).toBe("string");
});
