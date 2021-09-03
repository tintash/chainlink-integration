import { response } from 'express';
import fs from 'fs';
import os from 'os';
import { getRequestJob } from './chainlink-jobs/get-request';
import { postRequestJob } from './chainlink-jobs/post-request';
// ----------------------------------------------------------------
export interface ExternalInitiators {
  data: ExternalInitiator[];
}

export interface ExternalInitiator {
  type: string;
  id: string;
  attributes: Attributes;
}

export interface Attributes {
  name: string;
}

// ----------------------------------------------------------------
export interface NewExternalInitiator {
  data: Data;
}

export interface Data {
  attributes: Attributes;
}

export interface Attributes {
  name: string;
  incomingAccessKey: string;
  incomingSecret: string;
  outgoingToken: string;
  outgoingSecret: string;
}

//----------------------------------------------------------------
export interface NewBridge {
  data: Data;
}

export interface Data {
  type: string;
  id: string;
  attributes: Attributes;
}

export interface Attributes {
  name: string;
  url: string;
  confirmations: number;
  incomingToken: string;
  outgoingToken: string;
  minimumContractPayment: any;
  createdAt: string;
}

//----------------------------------------------------------------
export interface Bridge {
  data: Data;
}

export interface Data {
  type: string;
  id: string;
  attributes: Attributes;
}

export interface Attributes {
  name: string;
  url: string;
  confirmations: number;
  outgoingToken: string;
  minimumContractPayment: any;
  createdAt: string;
}

async function hasExternalInitiator(name: string, cookie: string): Promise<boolean> {
  return fetch(`http://localhost:6688/v2/external_initiators`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      cookie,
    },
  })
    .then(response => response.json())
    .then(response => response as ExternalInitiators)
    .then(response => response.data.some(initiator => initiator.attributes.name === name))
    .catch(error => {
      console.error(error);
      return false;
    });
}

async function hasBridge(name: string, cookie: string): Promise<boolean> {
  return fetch(`http://localhost:6688/v2/bridge_types/${name}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      cookie,
    },
  })
    .then(response => {
      if (response.status === 404) {
        return false;
      } else if (!response.ok) {
        throw new Error(
          `{ error: failed to get external initiator with given name, code: ${response.status} }`
        );
      }
      return response
        .json()
        .then(response => response as Bridge)
        .then(response => response.data.attributes.name === name);
    })
    .catch(error => {
      console.error(error);
      return false;
    });
}

export async function createExternalInitiator(cookie: string): Promise<boolean> {
  const eiName = String(process.env.CHAINLINK_EI_NAME);
  const eiURL = String(process.env.CHAINLINK_EI_URL);

  if (await hasExternalInitiator(eiName, cookie)) {
    console.log(`External initiator with name ${eiName} already exists`);
    return true;
  } else {
    return fetch(`http://localhost:6688/v2/external_initiators`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie,
      },
      body: JSON.stringify({
        name: eiName,
        url: eiURL,
      }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(
            `{ error: failed to create external initiator code: ${response.status} }`
          );
        }
        return response
          .json()
          .then(response => response as NewExternalInitiator)
          .then(response => {
            console.log(`created new external initiator: "${response.data.attributes.name}"`);
            setEnvValue('EI_IC_ACCESSKEY', response.data.attributes.incomingAccessKey);
            setEnvValue('EI_IC_SECRET', response.data.attributes.incomingSecret);
            setEnvValue('EI_CI_ACCESSKEY', response.data.attributes.outgoingToken);
            setEnvValue('EI_CI_SECRET', response.data.attributes.outgoingSecret);
            console.log(`updated external initiator environment vars`);
          })
          .then(() => true);
      })
      .catch(error => {
        console.error(error);
        return false;
      });
  }
}

export async function createBridge(cookie: string): Promise<boolean> {
  const bridgeName = String(process.env.CHAINLINK_BRIDGE_NAME);
  const bridgeURL = String(process.env.CHAINLINK_BRIDGE_URL);

  if (await hasBridge(bridgeName, cookie)) {
    console.log(`Bridge with name ${bridgeName} already exists`);
    return true;
  } else {
    return fetch(`http://localhost:6688/v2/bridge_types`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie,
      },
      body: JSON.stringify({
        name: bridgeName,
        url: bridgeURL,
      }),
    })
      .then(response => {
        if (!response.ok || response.status !== 200) {
          throw new Error('error: failed to create bridge');
        }
        return response
          .json()
          .then(response => response as NewBridge)
          .then(response => console.log(`created new bridge: "${response.data.attributes.name}"`))
          .then(() => true);
      })
      .catch(error => {
        console.error(error);
        return false;
      });
  }
}

export async function createJobs(cookie: string): Promise<void> {
  if (String(process.env.CREATE_SAMPLE_JOBS) === 'true') {
    createJob(JSON.stringify(getRequestJob), cookie, 'CHAINLINK_GET_JOB_ID');
    createJob(JSON.stringify(postRequestJob), cookie, 'CHAINLINK_POST_JOB_ID');
    setEnvValue('CREATE_SAMPLE_JOBS', 'false');
  } else {
    console.log(`Skipping sample jobs creation. "CREATE_SAMPLE_JOBS" is set to "false"`);
  }
}

async function createJob(jobPayload: string, cookie: string, envVar: string): Promise<void> {
  fetch(`http://localhost:6688/v2/specs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie,
    },
    body: jobPayload,
  })
    .then(response => {
      if (!response.ok || response.status !== 200) {
        response.json().then(response => {
          throw new Error(`{ error: failed to create job, msg: ${JSON.stringify(response)} }`);
        });
      }
      response
        .json()
        .then(response => response as NewBridge)
        .then(response => {
          console.log(`created new job with ID: ${response.data.id}`);
          process.env[envVar] = response.data.id;
          // console.log(`${envVar}: `, process.env[envVar]);
          setEnvValue(envVar, response.data.id);
        })
        .then(() => true);
    })
    .catch(error => {
      console.error(error);
    });
}

function setEnvValue(key: string, value: string) {
  // read file from hdd & split if from a linebreak to a array
  const ENV_VARS: string[] = fs.readFileSync('./.env', 'utf8').split(os.EOL);

  // find the env we want based on the key
  const target = ENV_VARS.indexOf(
    String(
      ENV_VARS.find(line => {
        return line.match(new RegExp(key));
      })
    )
  );
  // replace the key/value with the new value
  ENV_VARS.splice(target, 1, `${key}=${value}`);

  // write everything back to the file system
  fs.writeFileSync('./.env', ENV_VARS.join(os.EOL));
}
