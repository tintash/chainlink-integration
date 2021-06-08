var express = require('express');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var path = require('path');
const routes = require('./routes/index.js');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);

app.use( (req,res,next)=>{
  const ei_ci_acckey = req.headers["x-chainlink-ea-accesskey"];
  const ei_ci_secret = req.headers["x-chainlink-ea-secret"];
  if(typeof ei_ci_acckey !== 'undefined' && typeof ei_ci_secret !== 'undefined') {
    if(ei_ci_acckey === process.env.EI_CI_ACCESSKEY && ei_ci_secret === process.env.EI_CI_SECRET) {
      res.status(200).json({
        status: 200,
        message: 'Success'
      });
      return
    }
  }

  res.status(404).json({
    status: 404,
    message: 'Not Found'
  });
});

console.log('Server initiated!');
module.exports = app;
