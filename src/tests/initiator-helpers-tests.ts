import { validatePayment, getJobSpecMinPayment} from '../initiator-helpers';


test('Returns True on payment > Jobcost', () => {
  const payment= BigInt(20);
  const jobcost= BigInt(10);
  const result = validatePayment(payment ,jobcost);
  expect(result).resolves.toBe(true);
});

test('Returns True on payment = Jobcost', () => {
  const payment= BigInt(10);
  const jobcost= BigInt(10);
  const result = validatePayment(payment ,jobcost);
  expect(result).resolves.toBe(true);
});

test('Returns False on payment < jobcost', () => {
    const payment= BigInt(10);
    const jobcost= BigInt(20);
    const result = validatePayment(payment ,jobcost);
    expect(result).resolves.toBe(false);
  });

test('Throws error on invalid job id', async () => {
  const param = "dummy";
  await expect(getJobSpecMinPayment(param)).rejects.toThrowError('Error While Fetching JobSpec MinPayment');
});


test('successfully fetches minnimum job payment for valid jobID', async () => {
  const jobID = "1";
  await expect(getJobSpecMinPayment(jobID)).resolves.toBe(BigInt);
});