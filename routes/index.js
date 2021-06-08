var express = require('express');
const app = express();

var cryptocompare = require('./cryptocompare');
app.use('/cryptocompare' , cryptocompare);

module.exports = app;