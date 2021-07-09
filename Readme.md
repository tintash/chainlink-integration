

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

Please follow all the instructions mentioned in [this](https://www.youtube.com/watch?v=jJOjyDpg1aA&t=1012s&ab_channel=LearnwithCoffee) video tutorial for setting up the chanlink node on your system.

In the configuration (`.env`) of chainlink node add the following flag to enable external-initiator feature.

`FEATURE_EXTERNAL_INITIATORS=true`

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



### 3. Setting up Event Observer Server

Clone the following repository.

https://bitbucket.org/tintash/chainlink-integration/src/master/

#### 3.1 Creating an external initiator

Enter chainlink docker container's bash:

`docker exec -it {CONTAINER_ID/CONTAINER_NAME} bash`

You can extract `CONTAINER_ID/CONTAINER_NAME` using following command:

`docker ps`

Login chainlink using your email and password:

`chainlink admin login`

`chainlink initiators create {INITIATOR_NAME} http://{EVENT_OBSERVER_SERVER_IP}:3000`

You can extract `EVENT_OBSERVER_SERVER_IP` using following command:

`ipconfig getifaddr en0`

This will give us  **External Initiator Credentials**. 

In the `.env` file of Event Observer Server, add the credentials:

```.env
EI_IC_ACCESSKEY     = ce88170ece194bd3b9a093aef63bf6a7
EI_IC_SECRET        = FubljWCvvmu1FJsh2ngdVeZFcpzd9M7oc5RIrfxEnCplzcz0Xw6py+24P9tOYmVa
EI_CI_ACCESSKEY     = vFWJNHET9P1lGwulAXA+3sKew7Nby2byqV7i/WN3OYoohIrzpPd5IBqHKt0c8dfH
EI_CI_SECRET        = mZqbzBhk0IPrQ378lai8G2RUR5a962yyRTfODwA6bKGkQPaSWxrHZN66mlLtA0BA
```



### 4. Creating STX bridge in the chainlink node

Open the chainlink node in the browser by following the `http://localhost:6688` url and open the **Bridges** section to create new bridge.

Cretae External Adapter Bridge by providing `Bridge Name`, `Brige URL`, `Minimum Contract Payment`, and `Confirmations`.

Brige URL:  `http://{EVENT_OBSERVER_SERVER_IP}:3000/adapter`

Bridge Name: `Name of the bridge`

Minimum Contract Payment: `For now you can use 0`

Confirmations: `No of Confirmations for the Job to run`



### 5. Creating jobs in the chainlink node

Let's first setup a GET-request job in the chainlink node.

#### 5.1 Creating a GET-request job in the chainlink node

In the chainlink-integration directory named `chainlink-integration` that you cloned in the **Step 3**, there is a folder named `chainlink-jobs` containing job-specs for POST and GET requests. 

Copy the content of these JSON files to create jobs.

Open the chainlink node in the browser by following the `http://localhost:6688` url and open the **Jobs** section to create now Job.

Copy the content of the `get-request.json` file and place it in the `JSON Blob` text-box.

```json
{
    "name": "get-request",
    "initiators": [
        {
            "type": "external",
            "params": {
                "name": "external-initiator",
                "body": {}
            }
        }
    ],
    "tasks": [
        {
            "type": "httpget"
        },
        {
            "type": "jsonparse"
        },
        {
            "type": "external-adapter"
        }
    ]
}
```

Replace `"name": "external-initiator"` with `"name": "{INITIATOR_NAME}"` 

and also replace  `"type": "external-adapter"` with `"type": "{Bridge Name}"` .

And create the Job.

Once the job is created copy the **Job Spec Id** (e.g. `0c55d2044e3642c48918105095fe8dbe`), we have to convert this Key into `buffer type` .

**NOTE:** Your event observer server must be running as chainlink-node operator verifies the external adapter while creating a job.



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
  "buffer": "0x3063353564323034346533363432633438393138313035303935666538646265"
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



You can pass the `jod-spec-id buffer` , and `data-buffer`  in the function of the `direct-request` contract.



### 6. Deploying the smart contracts and running the server

Once you've followed the above steps, we need to deploy the smart contracts by using the following instructions.

In the Event Observer Server navigate to `contracts/clarity` folder and deploy the contracts:

`clarinet deploy --mocknet `

Start the Event Observer Server: 

`npm run start`

(you may need to run `npm install` before the above command).



### 7. Making a contract-call to `request-api` of  `direct-request.clar` contract

You need to pass the `jod-spec-id buffer` , and `data-buffer`  in `request-api` function of the `direct-request` contract.

The `direct-request` contract will call the `oracle` contract. The event emitted by the oracle contract is captured by our Event Observer Server, which will initiate our chainlink-job. On successful run of the job, `request fulfillment` is created and the expected data is recieved back in the `direct-request` contract.

### 8. Displaying the response recieved in the direct-request contract

Call the following contract function to get the response that we stored in the `data-value` variable in the `direct-request` contract.

`stx -t call_read_only_contract_func ST248M2G9DF9G5CX42C31DG04B3H47VJK6W73JDNC direct-request read-data-value {CALLE_PRINCIPAL}  -I http://localhost:20443`

This command will give the response in the the form of `buff`. You can decode it in the `string` and verify that the value is the same.

