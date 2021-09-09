import { createExternalInitiator, createBridge } from '../configure-chainlink';
jest.mock('node-fetch');
import fetch from 'node-fetch';
const { Response } = jest.requireActual('node-fetch');
import { mockFunction } from '../jestHelpers';
const mockfetch = mockFunction(fetch);

describe('Tests implementation for createExternalInitiator', () => {
  beforeEach(() => {
    mockfetch.mockReset();
  });

  test('Returns EI name when it already exists', async () => {
    const cookie = 'validCookie';
    const expected = {
      ok: true,
      status: 200,
      data: [
        {
          type: 'externalInitiators',
          id: '1',
          attributes: {
            name: 'stx-cl-ei',
            url: 'http://localhost:3000',
            accessKey: '8241df945ba94ca29b6778540cf39028',
            outgoingToken: 'VlwmXbx48Dwxl68QjjW8T6qDJhP29OK/LcmSIVN4vtno7ojQASCuGSgrpy9MC4gD',
            createdAt: '2021-09-03T16:45:52.950552+05:00',
            updatedAt: '2021-09-03T16:45:52.950552+05:00',
          },
        },
      ],
    };
    mockfetch.mockResolvedValueOnce(new Response(JSON.stringify(expected)));
    await expect(createExternalInitiator(cookie)).resolves.toBe('stx-cl-ei');
    expect(mockfetch).toHaveBeenCalledTimes(1);
    expect(mockfetch).toHaveBeenCalledWith('http://localhost:6688/v2/external_initiators', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookie,
      },
      body: undefined,
    });
  });

  test('Creates EI and set access and secret keys env variables', async () => {
    const cookie = 'validCookie';
    const expected = {
      ok: true,
      status: 200,
      data: [],
    };
    const expected2 = {
      ok: true,
      status: 201,
      data: {
        type: 'external initiators',
        id: 'stx-cl-ei',
        attributes: {
          name: 'stx-cl-ei',
          url: 'http://localhost:3000',
          incomingAccessKey: 'cf1de741a8094538a18c1700e9b6430a',
          incomingSecret: 'dU9ICdhLFnI2dru905zZv6MbsXwwI6qIP5pQRYmECZsI5bZTM1hXIEMCveVOoCHS',
          outgoingToken: 'D9ZWnEiRMWydufOk/VSPNeV3rRePviPmnyMpVj4dVmAJMdX1U5u/eF0tE+tIiysX',
          outgoingSecret: 'B22mRjfC2lUX84p6wK3tITA2IZL30Ck3WOqET1D5Z3vU34cb9YOzAmajL6NEK6Cx',
        },
      },
    };
    const body2 = JSON.stringify({
      name: 'stx-cl-ei',
      url: 'http://localhost:3000',
    });
    mockfetch.mockResolvedValueOnce(new Response(JSON.stringify(expected)));
    mockfetch.mockResolvedValueOnce(new Response(JSON.stringify(expected2)));

    await expect(createExternalInitiator(cookie)).resolves.toBe('stx-cl-ei');
    expect(mockfetch).toHaveBeenCalledTimes(2);
    expect(mockfetch).toHaveBeenNthCalledWith(1, 'http://localhost:6688/v2/external_initiators', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookie,
      },
      body: undefined,
    });
    expect(mockfetch).toHaveBeenNthCalledWith(2, 'http://localhost:6688/v2/external_initiators', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookie,
      },
      body: body2,
    });
    expect(process.env.EI_IC_ACCESSKEY).toBe('cf1de741a8094538a18c1700e9b6430a')
    expect(process.env.EI_IC_SECRET).toBe('dU9ICdhLFnI2dru905zZv6MbsXwwI6qIP5pQRYmECZsI5bZTM1hXIEMCveVOoCHS')
    expect(process.env.EI_CI_ACCESSKEY).toBe('D9ZWnEiRMWydufOk/VSPNeV3rRePviPmnyMpVj4dVmAJMdX1U5u/eF0tE+tIiysX')
    expect(process.env.EI_CI_SECRET).toBe('B22mRjfC2lUX84p6wK3tITA2IZL30Ck3WOqET1D5Z3vU34cb9YOzAmajL6NEK6Cx')
  });

  test('Throws exception when cookie is invalid or session is expired', async () => {
    const cookie = 'invalidCookie';
    const expected = {
      ok: false,
      status: 401,
      errors: [
        {
          detail: 'Session has expired',
        },
      ],
    };

    mockfetch.mockRejectedValueOnce(JSON.stringify(expected));
    try {
      await createExternalInitiator(cookie);
    } catch (err) {
      expect(err).toEqual(
        new Error('Error: {"ok":false,"status":401,"errors":[{"detail":"Session has expired"}]}')
      );
    }
    expect(mockfetch).toHaveBeenCalledTimes(1);
    expect(mockfetch).toHaveBeenCalledWith('http://localhost:6688/v2/external_initiators', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookie,
      },
      body: undefined,
    });
  });
});

describe('Tests implementation for createBridge', () => {
  beforeEach(() => {
    mockfetch.mockReset();
  });

  test('Returns bridge name when it already exists', async () => {
    const bridge = 'stx-cl-bridge';
    const cookie = 'validCookie';
    const expected = {
      ok: true,
      status: 200,
      data: {
        type: 'bridges',
        id: 'stx-cl-bridge',
        attributes: {
          name: 'stx-cl-bridge',
          url: 'http://localhost:3000/adapter',
          confirmations: 0,
          outgoingToken: 'MoMyMPLOxhJnehul/Va4a3Oar4Rc8yDJ',
          minimumContractPayment: null,
          createdAt: '2021-09-08T00:40:14.788531+05:00',
        },
      },
    };
    mockfetch.mockResolvedValueOnce(new Response(JSON.stringify(expected)));
    await expect(createBridge(cookie)).resolves.toBe('stx-cl-bridge');
    expect(mockfetch).toHaveBeenCalledTimes(1);
    expect(mockfetch).toHaveBeenCalledWith(`http://localhost:6688/v2/bridge_types/${bridge}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookie,
      },
      body: undefined,
    });
  });

  xit('Creates and returns bridge name when it does not already exist', async () => {
    const cookie = 'validCookie';
    const response = {
      ok: undefined,
      status: 404,
    };
    const expected2 = {
      ok: true,
      status: 201,
      data: {
        type: 'bridges',
        id: 'stx-cl-bridge',
        attributes: {
          name: 'stx-cl-bridge',
          url: 'http: //localhost:3000/adapter',
          confirmations: 0,
          incomingToken: '8R/TWk/GI+nV+bqzdcmt3HnfvMIzdMzH',
          outgoingToken: '3EsNQZbgWk3wFB9eWZYdiAUTeeBHrV0u',
          minimumContractPayment: null,
          createdAt: '2021-09-08T01:15:06.450299+05:00',
        },
      },
    };
    const body2 = JSON.stringify({
      name: 'stx-cl-bridge',
      url: 'http://localhost:3000/adapter',
    });
    mockfetch.mockImplementationOnce(() => Promise.resolve(new Response(JSON.stringify(response))));
    mockfetch.mockResolvedValueOnce(new Response(JSON.stringify(expected2)));

    await expect(createBridge(cookie)).resolves.toBe('stx-cl-bridge');
    expect(mockfetch).toHaveBeenCalledTimes(2);
    expect(mockfetch).toHaveBeenNthCalledWith(1, 'http://localhost:6688/v2/bridge_types', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookie,
      },
      body: undefined,
    });
    expect(mockfetch).toHaveBeenNthCalledWith(2, 'http://localhost:6688/v2/bridge_types', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookie,
      },
      body: body2,
    });
  });

  test('Throws exception when cookie is invalid or session is expired', async () => {
    const bridge = 'stx-cl-bridge';
    const cookie = 'invalidCookie';
    const expected = {
      ok: false,
      status: 401,
      errors: [
        {
          detail: 'Session has expired',
        },
      ],
    };

    mockfetch.mockRejectedValueOnce(JSON.stringify(expected));
    try {
      await createBridge(cookie);
    } catch (err) {
      expect(err).toEqual(
        new Error('Error: {"ok":false,"status":401,"errors":[{"detail":"Session has expired"}]}')
      );
    }
    expect(mockfetch).toHaveBeenCalledTimes(1);
    expect(mockfetch).toHaveBeenCalledWith(`http://localhost:6688/v2/bridge_types/${bridge}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookie,
      },
      body: undefined,
    });
  });
});
