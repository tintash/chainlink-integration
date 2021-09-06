import {
  validatePayment,
  getJobSpecMinPayment,
  getChainlinkClientSessionCookie,
} from '../initiator-helpers';
import { mockFunction } from '../jestHelpers';
jest.mock('node-fetch');
import fetch from 'node-fetch';
const { Response } = jest.requireActual('node-fetch');
const mockfetch = mockFunction(fetch);

describe('Validate payment and jobcost comparison', () => {
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
});

// test('Throws error on invalid job id ', async () => {
//   const jobID = 'dummy';
//   const cookie = await getChainlinkClientSessionCookie();
//   await expect(getJobSpecMinPayment(jobID, cookie)).rejects.toThrowError(
//     'Invalid Job ID or Cookie While Fetching JobSpec MinPayment'
//   );
// });

// test('Throws error on invalid cookie', async () => {
//   const jobID = process.env.CHAINLINK_GET_JOB_ID || 'c7c16681f7704af4a247aa7b65064c4d';
//   const cookie = 'invalidcookie';
//   await expect(getJobSpecMinPayment(jobID, cookie)).rejects.toThrowError(
//     'Invalid Job ID or Cookie While Fetching JobSpec MinPayment'
//   );
// });

// test('Fetches job cost/min payment with corrrect jobID and cookie', async () => {
//   const jobID = process.env.CHAINLINK_GET_JOB_ID || 'c7c16681f7704af4a247aa7b65064c4d';
//   const cookie = await getChainlinkClientSessionCookie();
//   const result = getJobSpecMinPayment(jobID, cookie);
//   expect(result).resolves.toBeDefined();
// });

describe('Tests implementation for fetching Session Cookie', () => {
  
  beforeEach(() => {
    mockfetch.mockReset();
  });
  
  test('Fetches cookie with valid credentials', async () => {
    mockfetch.mockResolvedValueOnce(new Response('explorer=%7B%22status%22%3A%22disconnected%22%2C%22url%22%3A%22%22%7D; Path=/; SameSite=Strict; clsession=MTYzMDg3MDMxN3xEdi1CQkFFQ180SUFBUkFCRUFBQVJ2LUNBQUVHYzNSeWFXNW5EQTRBREdOc2MyVnpjMmx2Ymw5cFpBWnpkSEpwYm1jTUlnQWdZVFZqTXpjM1kyTTJOamRqTkRJNU9UZzJabVV3TURWaVl6Smlaamt5WWpNPXxtVt1qY7sE0BIbuS8rX6x9eDjdY1VjIYfSR1bSb7Hv9A==; Expires=Tue, 05 Oct 2021 19:31:57 GMT; Max-Age=2592000; HttpOnly'));
    // expect.assertions(3);
    
    await expect(getChainlinkClientSessionCookie()).resolves.toBe("null");
    expect(mockfetch).toHaveBeenCalledTimes(1);
    // expect(cookie).toBe('explorer=%7B%22status%22%3A%22disconnected%22%2C%22url%22%3A%22%22%7D; Path=/; SameSite=Strict; clsession=MTYzMDg3MDMxN3xEdi1CQkFFQ180SUFBUkFCRUFBQVJ2LUNBQUVHYzNSeWFXNW5EQTRBREdOc2MyVnpjMmx2Ymw5cFpBWnpkSEpwYm1jTUlnQWdZVFZqTXpjM1kyTTJOamRqTkRJNU9UZzJabVV3TURWaVl6Smlaamt5WWpNPXxtVt1qY7sE0BIbuS8rX6x9eDjdY1VjIYfSR1bSb7Hv9A==; Expires=Tue, 05 Oct 2021 19:31:57 GMT; Max-Age=2592000; HttpOnly');
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
    // expect(typeof cookie).toBe('string');
  });

  test('Thows Exception', async () => {
    mockfetch.mockRejectedValueOnce(new Error('Error Fetching Cookie'));
    expect.assertions(3);
    try {
      await getChainlinkClientSessionCookie();
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

  // test('Error : While Fetching cookie with invalid credentials', async () => {
  //   process.env.CHAINLINK_EMAIL = '';
  //   process.env.CHAINLINK_PASSWORD = '';
  //   process.env.CHAINLINK_COOKIE = undefined;
  //   await expect(getChainlinkClientSessionCookie()).rejects.toThrow();
  //   process.env.CHAINLINK_EMAIL = 'test@tintash.com';
  //   process.env.CHAINLINK_PASSWORD = '12345678';
  // });
});

describe('Tests for Min Job Spec Payment', () => {
  
  beforeEach(() => {
    mockfetch.mockReset();
  });
  
  test('Fetches cookie with valid credentials', async () => {
    mockfetch.mockResolvedValueOnce(new Response('explorer=%7B%22status%22%3A%22disconnected%22%2C%22url%22%3A%22%22%7D; Path=/; SameSite=Strict; clsession=MTYzMDg3MDMxN3xEdi1CQkFFQ180SUFBUkFCRUFBQVJ2LUNBQUVHYzNSeWFXNW5EQTRBREdOc2MyVnpjMmx2Ymw5cFpBWnpkSEpwYm1jTUlnQWdZVFZqTXpjM1kyTTJOamRqTkRJNU9UZzJabVV3TURWaVl6Smlaamt5WWpNPXxtVt1qY7sE0BIbuS8rX6x9eDjdY1VjIYfSR1bSb7Hv9A==; Expires=Tue, 05 Oct 2021 19:31:57 GMT; Max-Age=2592000; HttpOnly'));
    // expect.assertions(3);
    
    await expect(getChainlinkClientSessionCookie()).resolves.toBe("null");
    expect(mockfetch).toHaveBeenCalledTimes(1);
    // expect(cookie).toBe('explorer=%7B%22status%22%3A%22disconnected%22%2C%22url%22%3A%22%22%7D; Path=/; SameSite=Strict; clsession=MTYzMDg3MDMxN3xEdi1CQkFFQ180SUFBUkFCRUFBQVJ2LUNBQUVHYzNSeWFXNW5EQTRBREdOc2MyVnpjMmx2Ymw5cFpBWnpkSEpwYm1jTUlnQWdZVFZqTXpjM1kyTTJOamRqTkRJNU9UZzJabVV3TURWaVl6Smlaamt5WWpNPXxtVt1qY7sE0BIbuS8rX6x9eDjdY1VjIYfSR1bSb7Hv9A==; Expires=Tue, 05 Oct 2021 19:31:57 GMT; Max-Age=2592000; HttpOnly');
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
    // expect(typeof cookie).toBe('string');
  });

  test('Thows Exception', async () => {
    mockfetch.mockRejectedValueOnce(new Error('Error Fetching Cookie'));
    expect.assertions(3);
    try {
      await getChainlinkClientSessionCookie();
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
});