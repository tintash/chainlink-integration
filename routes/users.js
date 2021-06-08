var express = require('express');
var router = express.Router();
// const https = require('https');
const request = require('request');


router.get('/', function(req, res, next) {
  const data = {
    get: "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD",
    path: "USD",
    times: 100,
    test: 'hello'
  };
  const options = {
    url: 'http://localhost:6688/v2/specs/a517a60fe7794719be92c3301f7a3312/runs',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Chainlink-EA-AccessKey': process.env.EI_IC_ACCESSKEY,
      'X-Chainlink-EA-Secret': process.env.EI_IC_SECRET
    },
    json: data
  }
  request(options, function (error, response, body) {
    if (error) {
      res.send(res);
    }
    res.send(response);
  });
});


router.post('/', function(req, res, next) {
  
  let price = parseFloat(req.body.data.result)/100;
  console.log(req.body.data);

  res.status(200).json({
    data: {
      symbol: "ETH-USD",
      value: price
    }
  });
});

module.exports = router;



