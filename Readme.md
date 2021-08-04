
  
  

## Instructions for running the stacks-chainlink integration (Direct request model)

  

This document outlines the components required and contains all the instructions required for running the direct request model on your system.

  

### Components for running the DRM(Direct Request Model)

  

1. Chainlink Node

2. Stacks-node

3. Stacks-blockchain-api

4. Clarinet project

5. Event Observer Server
  

First of all, we need to set up a chainlink node on our system.

 
### 1. Setting up a test chainlink node

  

#### 1.1 Chainlink node setup

  

Please follow all the instructions mentioned in [this](https://www.youtube.com/watch?v=jJOjyDpg1aA&t=1012s&ab_channel=LearnwithCoffee) video tutorial for setting up the chanlink node on your system.

  

In the configuration (`.env`) of chainlink, for testing you can use following ethereum configurations:
  
`ETH_CHAIN_ID=4`
`ETH_URL=wss://rinkeby.infura.io/ws/v3/1591d41e51084ba0ab2100ae61696619
`
`LINK_CONTRACT_ADDRESS=0x01BE23585060835E02B77ef475b0Cc51aA1e0709`

  

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

endpoint = "host.docker.internal:3000"

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


### 3. Setting up Postgres

#### 3.1  Pull and run postgres Docker container

`docker run -d --name postgres -e POSTGRES_PASSWORD=12345678 -v ${PATH}/postgres-data/:/var/lib/lib/postgresql/data -p 5432:5432 postgres`

`PATH` is the directory to store the postgres temp data in.

#### 3.2 Run postgres container 
`docker start postgres`
  

### 4. Setting up Event Observer Server


#### 4.1 Clone the following repository.

https://bitbucket.org/tintash/chainlink-integration/src/master/
  

### 5. Creating jobs in the chainlink node



Let's first setup a GET-request job in the chainlink node.

  

#### 5.1 Creating a GET-request job in the chainlink node

  

In the chainlink-integration directory named `chainlink-integration` that you cloned in the **Step 3**, there is a folder named `chainlink-jobs` containing job-specs for POST and GET requests.

  

Copy the content of these JSON files to create jobs.

  

Open the chainlink node in the browser by following the `http://localhost:6688` url and open the **Jobs** section to create now Job.

  

Copy the content of the `get-request.json` file and place it in the `JSON Blob` text-box and create the Job.

Once the job is created copy the **Job Spec Id** (e.g. `0c55d2044e3642c48918105095fe8dbe`), we have to convert this Key into `buffer type` .

This `address: 0x516bab9884c2abe9950a424b36dc3bb35603a2dc`  under params of `runlog` initiator defines that this job will be initiated by the contract with address `0x516bab9884c2abe9950a424b36dc3bb35603a2dc`. So this `0x516bab9884c2abe9950a424b36dc3bb35603a2dc` is the address of our `oracle.sol` contract that has been deployed on rinkeby test-net.

##### 5.1.1 Converting the Job Spec Id into buff

You can encode your `job-spec-id` into hex-buffer using this endpoint:


`http://localhost:3000/key-to-buff`

  

Sample request body:

  

```json

{

"key": "0c55d2044e3642c48918105095fe8dbe"

}

```

  

Sample response:

  

```json

{

"key": "0c55d2044e3642c48918105095fe8dbe"

"buffer":  "0x3063353564323034346533363432633438393138313035303935666538646265"

}

```

  
  
  
  
  

You can encode chainlink-job parameters using following end-points:

  

`http://localhost:3000/create-buff`

  

Sample request body:

  

```json

{

"get": "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD",

"path": "USD"

}

```

  

Sample response:

  

```json

{

"buffer": "0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d",

"length": 86,

"type": "bytes"

}

```

  
  
  

You can pass the `jod-spec-id buffer` , and `data-buffer` in the function of the `direct-request` contract.

  
  
  

### 6. Deploying the smart contracts and running the server

  

Once you've followed the above steps, we need to deploy the smart contracts by using the following instructions.

  

In the Event Observer Server navigate to `contracts/clarity` folder and deploy the contracts:

  

`clarinet deploy --mocknet `

  

Start the Event Observer Server:

  

`npm run start`

  

(you may need to run `npm install` before the above command).

  
  
  

### 7. Making a contract-call to `request-api` of `direct-request.clar` contract

  

You need to pass the `jod-spec-id buffer` , and `data-buffer` in `request-api` function of the `direct-request` contract.

  

The `direct-request` contract will call the `oracle` contract. The event emitted by the oracle contract is captured by our Event Observer Server, which will initiate our chainlink-job. On successful run of the job, `request fulfillment` is created and the expected data is recieved back in the `direct-request` contract.

  

### 8. Displaying the response recieved in the direct-request contract

  

Call the following contract function to get the response that we stored in the `data-value` variable in the `direct-request` contract.

  

`stx -t call_read_only_contract_func ST248M2G9DF9G5CX42C31DG04B3H47VJK6W73JDNC direct-request read-data-value {CALLE_PRINCIPAL} -I http://localhost:20443`

  

This command will give the response in the the form of `buff`. You can decode it in the `string` and verify that the value is the same.