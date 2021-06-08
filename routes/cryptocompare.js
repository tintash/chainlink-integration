var express = require('express');
var router = express.Router();
const request = require('request');


function isInvalidComparison(req) {
    return (typeof req.body.value_of === 'undefined') || (typeof req.body.value_in === 'undefined');
}

function createChainlinkRequestHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-Chainlink-EA-AccessKey': process.env.EI_IC_ACCESSKEY,
        'X-Chainlink-EA-Secret': process.env.EI_IC_SECRET
    }
}


router.post('/', async (req, res) => {
    if(isInvalidComparison(req)) {
        res.status(500).json({
            status: 500,
            message: 'bad request body'
        });
        return;
    }

    const value_of = String(req.body.value_of).toUpperCase();
    const value_in = String(req.body.value_in).toUpperCase();
    const compareURL = 'https://min-api.cryptocompare.com/data/price?fsym='+value_of+'&tsyms='+value_in;

    const data = {
        get: compareURL,
        path: value_in,
        payload: {}
    };

    try {
        const response = await executeChainlinkRequest('a396ce62ada24a049d2123315a4a2b52', data);
        res.status(200).send(response);
    } catch (err) {
        res.send(err);
    }
})


/*** makes a post request to chainlink node at jobid ***/
async function executeChainlinkRequest(jobId, data) {
    const chainlinkNodeURL = process.env.EI_CHAINLINKURL + process.env.EI_LINK_JOB_PATH + jobId + '/runs';
    const options = {
        url: chainlinkNodeURL,
        method: 'POST',
        headers: createChainlinkRequestHeaders(),
        json: data
    }
    return new Promise((resolve, reject) => {
        request(options, function (error, response, body) {
            if (error) {
                reject(error);
            }
            resolve(response);
        });
    })
}


/*** cryptocomparebridge - bridge on chainlink node ***/
router.post('/callback', function(req, res, next) {
    let price = parseFloat(req.body.data.result);
    console.log(req.body.data);
    res.status(200).json({
        symbol: "ETH-USD",
        value: price,
        data: req.body.data
    });
});


module.exports = router;