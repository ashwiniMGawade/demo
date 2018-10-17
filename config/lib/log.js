'use strict';

var winston = require('winston'),
    moment = require('moment'),
    path = require('path');

var customTimestamp = function(){
  var formattedDate = moment().format('MMM Do YYYY, h:mm:ss a');
  return formattedDate;
};

var customFormatter = function(options){
  return options.timestamp() +'  |  '+ options.message;
};

var logger = new (winston.Logger)({
   transports: [
     new (winston.transports.Console)({
                  showLevel: false,
                  timestamp: customTimestamp,
                  formatter: customFormatter,
                }),
     new (winston.transports.File)({
                  name: 'info-server-log',
                  filename: path.join(path.dirname(path.dirname(__dirname)), "logs", "server.log"),
                  level: 'debug',
                  showLevel: false,
                  maxsize: 10000000,
                  json: false,
                  handleExceptions: true,
                  humanReadableUnhandledException: true,
                  timestamp: customTimestamp,
                  formatter: customFormatter
                }),
     new (winston.transports.File)({
                  name: 'error-server-log',
                  filename: path.join(path.dirname(path.dirname(__dirname)), "logs", "server-error.log"),
                  level: 'error',
                  showLevel: false,
                  maxsize: 10000000,
                  json: false,
                  handleExceptions: true,
                  humanReadableUnhandledException: true,
                  timestamp: customTimestamp,
                  formatter: customFormatter
                })
    ],
   exitOnError: false
 });

 logger.stream = {
    write: function(message, encoding){
        logger.info(message);
    }
  };

module.exports = logger;
