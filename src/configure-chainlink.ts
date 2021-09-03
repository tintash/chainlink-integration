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

// ----------------------------------------------------------------
export interface NewJob {
  data: Data;
}

export interface Data {
  type: string;
  id: string;
  attributes: Attributes;
}

export interface Attributes {
  id: string;
  name: string;
  minPayment: string;
}

//----------------------------------------------------------------
async function hasExternalInitiator(name: string, cookie: string): Promise<boolean> {
  const EIs = await chainlinkfetch<ExternalInitiators>(
    'http://localhost:6688/v2/external_initiators',
    'GET',
    cookie,
    undefined
  );
  return EIs.data.some(initiator => initiator.attributes.name === name);
}

async function hasBridge(name: string, cookie: string): Promise<boolean> {
  const bridge = await chainlinkfetch<Bridge>(
    `http://localhost:6688/v2/bridge_types/${name}`,
    'GET',
    cookie,
    undefined
  );
  return bridge.data.attributes.name === name;
}

export async function createExternalInitiator(cookie: string): Promise<string> {
  const eiName = String(process.env.CHAINLINK_EI_NAME);
  const body = JSON.stringify({
    name: eiName,
    url: String(process.env.CHAINLINK_EI_URL),
  });

  if (await hasExternalInitiator(eiName, cookie)) {
    console.log(`External initiator with name ${eiName} already exists`);
    return eiName;
  } else {
    const ei = await chainlinkfetch<NewExternalInitiator>(
      'http://localhost:6688/v2/external_initiators',
      'POST',
      cookie,
      body
    );

    console.log(`created new external initiator: "${ei.data.attributes.name}"`);
    process.env['EI_IC_ACCESSKEY'] = ei.data.attributes.incomingAccessKey;
    process.env['EI_IC_SECRET'] = ei.data.attributes.incomingSecret;
    process.env['EI_CI_ACCESSKEY'] = ei.data.attributes.outgoingToken;
    process.env['EI_CI_SECRET'] = ei.data.attributes.outgoingSecret;
    setEnvValue('EI_IC_ACCESSKEY', ei.data.attributes.incomingAccessKey);
    setEnvValue('EI_IC_SECRET', ei.data.attributes.incomingSecret);
    setEnvValue('EI_CI_ACCESSKEY', ei.data.attributes.outgoingToken);
    setEnvValue('EI_CI_SECRET', ei.data.attributes.outgoingSecret);
    console.log(`updated external initiator environment vars`);
    return ei.data.attributes.name;
  }
}

export async function createBridge(cookie: string): Promise<string> {
  const bridgeName = String(process.env.CHAINLINK_BRIDGE_NAME);
  const body = JSON.stringify({
    name: bridgeName,
    url: String(process.env.CHAINLINK_BRIDGE_URL),
  });

  if (await hasBridge(bridgeName, cookie)) {
    console.log(`Bridge with name ${bridgeName} already exists`);
    return bridgeName;
  } else {
    const bridge = await chainlinkfetch<NewBridge>(
      'http://localhost:6688/v2/bridge_types',
      'POST',
      cookie,
      body
    );

    console.log(`created new bridge: "${bridge.data.attributes.name}"`);
    return bridge.data.attributes.name;
  }
}

export async function createJobs(cookie: string): Promise<void> {
  if (String(process.env.CREATE_SAMPLE_JOBS) === 'true') {
    const getJob = createJob(JSON.stringify(getRequestJob), cookie, 'CHAINLINK_GET_JOB_ID');
    const postJob = createJob(JSON.stringify(postRequestJob), cookie, 'CHAINLINK_POST_JOB_ID');
    Promise.all([getJob, postJob]).then(([getJobId, postJobId]) => {
      if (getJobId !== '' && postJobId !== '') {
        setEnvValue('CREATE_SAMPLE_JOBS', 'false');
      }
    });
  } else {
    console.log(`Skipping sample jobs creation. "CREATE_SAMPLE_JOBS" is set to "false"`);
  }
}

async function createJob(jobPayload: string, cookie: string, envVar: string): Promise<string> {
  const job = await chainlinkfetch<NewJob>(
    'http://localhost:6688/v2/specs',
    'POST',
    cookie,
    jobPayload
  );
  console.log(`created new job with ID: ${job.data.id}`);
  process.env[envVar] = job.data.id;
  setEnvValue(envVar, job.data.id);
  return job.data.id;
}

function chainlinkfetch<T>(
  url: string,
  method: string,
  cookie: string,
  body: string | undefined
): Promise<T> {
  return fetch(url, {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      cookie,
    },
    body: body,
  })
    .then(response => {
      if (!response.ok) {
        response.json().then(response => {
          throw new Error(`{ error: ${JSON.stringify(response)}, code: ${response.status} }`);
        });
      }
      return response.json().then(response => response as T);
    })
    .catch(error => {
      throw new Error(error);
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
