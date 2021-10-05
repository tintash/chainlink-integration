import {
  validatePayment,
  getJobSpecMinPayment,
  getChainlinkClientSessionCookie,
} from '../initiator-helpers';
import { mockFunction } from '../jestHelpers';
jest.mock('node-fetch');
import fetch from 'node-fetch';
const { Response, Headers } = jest.requireActual('node-fetch');
const mockfetch = mockFunction(fetch);
const chainlinkHost = 'localhost';

describe('Tests for validating payment and jobcost comparison', () => {
  test('Returns True on payment > jobcost', () => {
    const payment = BigInt(20);
    const jobcost = BigInt(10);
    const result = validatePayment(payment, jobcost);
    expect(result).resolves.toBe(true);
  });

  test('Returns true on payment = jobcost', () => {
    const payment = BigInt(10);
    const jobcost = BigInt(10);
    const result = validatePayment(payment, jobcost);
    expect(result).resolves.toBe(true);
  });

  test('Returns false on payment < jobcost', () => {
    const payment = BigInt(10);
    const jobcost = BigInt(20);
    const result = validatePayment(payment, jobcost);
    expect(result).resolves.toBe(false);
  });
});

describe('Tests for fetching session cookie', () => {
  beforeEach(() => {
    mockfetch.mockReset();
  });
  test('Fetches cookie with valid credentials', async () => {
    const response = new Response();
    response.headers.set(
      'set-cookie',
      'explorer=%7B%22status%22%3A%22disconnected%22%2C%22url%22%3A%22%22%7D; Path=/; SameSite=Strict, clsession=MTYzMDg3MDMxN3xEdi1CQkFFQ180SUFBUkFCRUFBQVJ2LUNBQUVHYzNSeWFXNW5EQTRBREdOc2MyVnpjMmx2Ymw5cFpBWnpkSEpwYm1jTUlnQWdZVFZqTXpjM1kyTTJOamRqTkRJNU9UZzJabVV3TURWaVl6Smlaamt5WWpNPXxtVt1qY7sE0BIbuS8rX6x9eDjdY1VjIYfSR1bSb7Hv9A==; Expires=Tue, 05 Oct 2021 19:31:57 GMT; Max-Age=2592000; HttpOnly'
    );
    mockfetch.mockResolvedValueOnce(response);

    expect.assertions(3);
    await expect(getChainlinkClientSessionCookie(chainlinkHost)).resolves.toBe(
      'explorer=%7B%22status%22%3A%22disconnected%22%2C%22url%22%3A%22%22%7D; Path=/; SameSite=Strict; clsession=MTYzMDg3MDMxN3xEdi1CQkFFQ180SUFBUkFCRUFBQVJ2LUNBQUVHYzNSeWFXNW5EQTRBREdOc2MyVnpjMmx2Ymw5cFpBWnpkSEpwYm1jTUlnQWdZVFZqTXpjM1kyTTJOamRqTkRJNU9UZzJabVV3TURWaVl6Smlaamt5WWpNPXxtVt1qY7sE0BIbuS8rX6x9eDjdY1VjIYfSR1bSb7Hv9A==; Expires=Tue, 05 Oct 2021 19:31:57 GMT; Max-Age=2592000; HttpOnly'
    );
    expect(mockfetch).toHaveBeenCalledTimes(1);
    expect(mockfetch).toHaveBeenCalledWith('http://localhost:6688/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@tintash.com',
        password: '12345678',
      }),
    });
  });

  test('Thows Exception', async () => {
    mockfetch.mockRejectedValueOnce(new Error('Error Fetching Cookie'));
    expect.assertions(3);
    try {
      await getChainlinkClientSessionCookie(chainlinkHost);
    } catch (err) {
      expect(err).toEqual(new Error('Error Fetching Cookie'));
    }
    expect(mockfetch).toHaveBeenCalledTimes(1);
    expect(mockfetch).toHaveBeenCalledWith('http://localhost:6688/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@tintash.com',
        password: '12345678',
      }),
    });
  });

  test('Returns cookie from env variables if it is already defined', async () => {
    process.env.CHAINLINK_COOKIE =
      'explorer=%7B%22status%22%3A%22disconnected%22%2C%22url%22%3A%22%22%7D; Path=/; SameSite=Strict; clsession=MTYzMDg3MDMxN3xEdi1CQkFFQ180SUFBUkFCRUFBQVJ2LUNBQUVHYzNSeWFXNW5EQTRBREdOc2MyVnpjMmx2Ymw5cFpBWnpkSEpwYm1jTUlnQWdZVFZqTXpjM1kyTTJOamRqTkRJNU9UZzJabVV3TURWaVl6Smlaamt5WWpNPXxtVt1qY7sE0BIbuS8rX6x9eDjdY1VjIYfSR1bSb7Hv9A==; Expires=Tue, 05 Oct 2021 19:31:57 GMT; Max-Age=2592000; HttpOnly';

    expect.assertions(1);
    await expect(getChainlinkClientSessionCookie(chainlinkHost)).resolves.toBe(
      'explorer=%7B%22status%22%3A%22disconnected%22%2C%22url%22%3A%22%22%7D; Path=/; SameSite=Strict; clsession=MTYzMDg3MDMxN3xEdi1CQkFFQ180SUFBUkFCRUFBQVJ2LUNBQUVHYzNSeWFXNW5EQTRBREdOc2MyVnpjMmx2Ymw5cFpBWnpkSEpwYm1jTUlnQWdZVFZqTXpjM1kyTTJOamRqTkRJNU9UZzJabVV3TURWaVl6Smlaamt5WWpNPXxtVt1qY7sE0BIbuS8rX6x9eDjdY1VjIYfSR1bSb7Hv9A==; Expires=Tue, 05 Oct 2021 19:31:57 GMT; Max-Age=2592000; HttpOnly'
    );
  });
});

describe('Tests for min job spec payment', () => {
  beforeEach(() => {
    mockfetch.mockReset();
  });

  test('Fetches min job payment against jobID', async () => {
    mockfetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { id: 1, attributes: { minPayment: 2 } } }))
    );
    const jobID = 'ebb3bff75a1846fe93bf2f12c73ca2cb';
    const cookie = 'validTestCookie';
    expect.assertions(4);

    const result = await getJobSpecMinPayment(jobID, cookie, chainlinkHost);
    expect(result).toBe(2);
    expect(mockfetch).toHaveBeenCalledTimes(1);
    expect(mockfetch).toHaveBeenCalledWith(`http://localhost:6688/v2/specs/${jobID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookie,
      },
    });
    expect(typeof result).toBe('number');
  });

  test('returns default min job payment = 1 when payment is not specified in jobspec', async () => {
    mockfetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ data: { id: 'ebb3bff75a1846fe93bf2f12c73ca2cb', attributes: {} } })
      )
    );
    const jobID = 'ebb3bff75a1846fe93bf2f12c73ca2cb';
    const cookie = 'validTestCookie';
    // expect.assertions(4);

    const result = await getJobSpecMinPayment(jobID, cookie, chainlinkHost);
    expect(result).toBe(1);
    expect(mockfetch).toHaveBeenCalledTimes(1);
    expect(mockfetch).toHaveBeenCalledWith(`http://localhost:6688/v2/specs/${jobID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookie,
      },
    });
    expect(typeof result).toBe('number');
  });

  test('Thows exception on invalid jobID or cookie or both', async () => {
    const jobID = 'ebb3bff75a1846fe93bf2f12c73ca2cb';
    const cookie = 'InvalidTestCookie';

    mockfetch.mockResolvedValueOnce(new Response(JSON.stringify({})));
    expect.assertions(3);
    try {
      await getJobSpecMinPayment(jobID, cookie, chainlinkHost);
    } catch (err) {
      expect(err).toEqual(new Error('Invalid Job ID or Cookie While Fetching JobSpec MinPayment'));
    }
    expect(mockfetch).toHaveBeenCalledTimes(1);
    expect(mockfetch).toHaveBeenCalledWith(`http://localhost:6688/v2/specs/${jobID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookie,
      },
    });
  });

  test('Thows exception on unknown failure', async () => {
    const jobID = 'ebb3bff75a1846fe93bf2f12c73ca2cb';
    const cookie = 'InvalidTestCookie';

    mockfetch.mockRejectedValueOnce(new Error('{ error: Failed Fetching JobSpec MinPayment }'));
    // expect.assertions(3);
    try {
      await getJobSpecMinPayment(jobID, cookie, chainlinkHost);
    } catch (err) {
      expect(err).toEqual(new Error('{ error: Failed Fetching JobSpec MinPayment }'));
    }
    expect(mockfetch).toHaveBeenCalledTimes(1);
    expect(mockfetch).toHaveBeenCalledWith(`http://localhost:6688/v2/specs/${jobID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookie,
      },
    });
  });
});
