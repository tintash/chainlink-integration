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

describe('Tests implementation for fetching Session Cookie', () => {
  beforeEach(() => {
    mockfetch.mockReset();
  });
    test('Fetches cookie with valid credentials', async () => {
      mockfetch.mockResolvedValueOnce(
        new Response(
          'explorer=%7B%22status%22%3A%22disconnected%22%2C%22url%22%3A%22%22%7D; Path=/; SameSite=Strict; clsession=MTYzMDg3MDMxN3xEdi1CQkFFQ180SUFBUkFCRUFBQVJ2LUNBQUVHYzNSeWFXNW5EQTRBREdOc2MyVnpjMmx2Ymw5cFpBWnpkSEpwYm1jTUlnQWdZVFZqTXpjM1kyTTJOamRqTkRJNU9UZzJabVV3TURWaVl6Smlaamt5WWpNPXxtVt1qY7sE0BIbuS8rX6x9eDjdY1VjIYfSR1bSb7Hv9A==; Expires=Tue, 05 Oct 2021 19:31:57 GMT; Max-Age=2592000; HttpOnly'
        )
      );
      
      expect.assertions(3);
      await expect(getChainlinkClientSessionCookie()).resolves.toBe('null');
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
