## Instructions for running the stacks-chainlink integration (Direct request model)

This document outlines the components required and contains all the instructions required for running the direct request model on your system.

### Components for running the DRM(Direct Request Model)

1. Chainlink Node
2. Stacks-node
3. Stacks-blockchain-api
4. Clarinet project
5. Event observer server(external intiator & external adapter)

First of all, we need to set up a chainlink node on our system.

### 1. Setting up chainlink node on our system

#### 1.1 Chainlink node setup

Please clone [this](https://github.com/zeeshanakram27/chainlink/tree/feat/stacks-chainlink-integration-ui-changes) repo and checkout to `stacks-chainlink-integration-ui-changes` branch, and refer to instructions to setup the chainlink node.

In the configuration (`.env`) of chainlink node add the following flag to enable external-initiator feature.

`FEATURE_EXTERNAL_INITIATORS=true`

Also add your Stacks address, that will be used to create transaction by External Adapter(EA) and its `stx` balance will be visible on Chainlink node dashboard, and Stacks chain/node url to `.env` file.

```.env
STACKS_ACCOUNT_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
STACKS_NODE_URL=http://localhost:3999
```

#### 1.2 Setup POSTGRES database

To run Chainlink node you would require a runnig instance of POSTGRES server with a database named `chainlink` already created in it.

Install Postgres

`brew install postgresql`

Login to Postgres server

`psql -U postgres -h localhost`

Create database

`create database chainlink;`

Add `DATABASE_URL` to `.env` file

`DATABASE_URL=postgresql://{USERNAME}:{PASSWORD}@localhost:5432/chainlink?sslmode=disable`

#### 1.3 Running Chainlink node

Build the application.

`make install`

Run the Chainlink node.

`./chainlink local node --password password.txt --api apicredentials.txt`

Once you have setup the chainlink node and tested it works fine, it's time to run the **stacks-blockchain-api** on our system.

### 2. Running stacks-blockchain-api on our system

First clone the repository by using the following command.

`git clone https://github.com/blockstack/stacks-blockchain-api`

and build the application.

`cd stacks-blockchain-api`

#### 2.1 `Stacks-dev.toml` file

In the `stacks-blockchain-api` directory add the folowing lines in the `Stacks-dev.toml` file.

```toml
[[mstx_balance]]
address = "ST248M2G9DF9G5CX42C31DG04B3H47VJK6W73JDNC"
amount = 10000000000000000
# secretKey = "4773c54317d082ff5cce3976e6a2a1b691f65ab82ec59e98fe97460a922019ee01"
# mnemonic = "elevator pulse copper license toilet kid city render can useful below toward collect employ credit nice carpet hello family wool bicycle unique fire spider"

[[events_observer]]
endpoint = "host.docker.internal:3501"
retry_count = 255
events_keys = ["*"]
```

#### 2.2 Setup services

Build the services by using the following command.

`npm run devenv:build `

Then run `npm run devenv:deploy` which uses docker-compose to deploy the service dependencies (e.g. PostgreSQL, Blockstack core node, etc).

#### 2.3 Running the server

Then run the server by using the following command.

`npm run dev`

### 3. Setting up Event Observer Server

Clone the following repository.

https://bitbucket.org/tintash/chainlink-integration/src/master/

#### 3.1 Add Chainlink node related configuration

Add following configuration flags in `.env` file.

```.env
CHAINLINK_EI_NAME = {EXTERNAL_INITIATOR_NAME}
CHAINLINK_EI_URL = http://localhost:3501
CHAINLINK_BRIDGE_NAME = {EXTERNAL_ADAPTER_NAME}
CHAINLINK_BRIDGE_URL = http://localhost:3501/adapter
```

Set `CONFIGURE_CHAINLINK` to `true` to automate the process of creating External Initiator(EI), and External Adapter(EA) of provided names if they don't exist already. Otherwise manually create them.

Set `CREATE_SAMPLE_JOBS` to `true` to create sample Get and Post jobs

```.env
CONFIGURE_CHAINLINK = false
CREATE_SAMPLE_JOBS = false
```

Then add following credential env vars, these will be automatically replaced by the credentials of newly created EI.

```.env
EI_IC_ACCESSKEY=""
EI_IC_SECRET=""
EI_CI_ACCESSKEY=""
EI_CI_SECRET=""
```

#### 3.2 Running the server

Then run the server by using the following command.

`npm run start`

### 4. Deploying the smart contracts and running the server

Once you've followed the above steps, we need to deploy the smart contracts by using the following instructions.

In the Event Observer Server navigate to `contracts/clarity` folder and deploy the contracts:

`clarinet publish --devnet `

Start the Event Observer Server:

`npm run start`

(you may need to run `npm install` before the above command).

### 5. Making a contract-call to `create-request` of `direct-request.clar` contract

You need to pass the `jod-spec-id buffer` , and `data-buffer` in `create-request` function of the `direct-request` contract.

The `direct-request` contract will make a `transfer-and-call` call to the `oracle` contract using the `stxlink-token`. The event emitted by the oracle contract is captured by our Event Observer Server, which will initiate our chainlink-job. On successful run of the job, `request fulfillment` is created and the expected data is recieved back in the `direct-request` contract.

### 6. Displaying the response recieved in the direct-request contract

Call the following contract function to get the response that we stored in the `data-value` variable in the `direct-request` contract.

`stx -t call_read_only_contract_func ST248M2G9DF9G5CX42C31DG04B3H47VJK6W73JDNC direct-request read-data-value {CALLE_PRINCIPAL} -I http://localhost:20443`

This command will give the response in the the form of `buff`. You can decode it in the `string` and verify that the value is the same.
