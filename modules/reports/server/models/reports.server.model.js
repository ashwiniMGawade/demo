'use strict';

var fs = require('fs-extended'),
  path = require('path'),
  config = require(path.resolve('./config/config')),
  logger = require(path.resolve('./config/lib/log')),
  mongoose = require('mongoose');

module.exports = {
  list: list,
  read: read
};
//List of Reports
function list(tenant, start, end, callback) {
  var fileCount = 0;
  var filter = function (itemPath, stat) {
    if (!start && !end) {
      fileCount += 1;
      if (fileCount > config.reports.default_records){
        return false;
      } else {
        return true;
      }
    }
    var fileName = path.basename(itemPath);
    var fileParts = fileName.split('_');
    var timestamp = fileParts[fileParts.length - 1];
    timestamp = timestamp.split('.')[0];
    if (timestamp >= start && timestamp <= end) {
      return true;
    } else {
      return false;
    }
  };

  var compare  = function(a, b){
    return a > b ? -1 : 1;
  };

  var reports_dir = config.reports.storage_path;

  if (tenant === 'all') {
    try {
      var stats = fs.lstatSync(reports_dir + 'daily');
      if (stats.isDirectory()) {
        fs.listAll(reports_dir + 'daily', { filter: filter , sort: compare}, callback);
      }
    } catch(e) {
      logger.info('Error - ');
      logger.info(JSON.stringify(e));
      callback(null, []);
    }
  } else {
     mongoose.model('Tenant').findById(tenant).exec(function (err, tenant) {
      if (err) {
        logger.info(err);      
        callback('Invalid Tenant ID');
      } else if (!tenant) {
        callback('Invalid Tenant ID');
      } else {
        try {
          logger.info('Dir - ' + reports_dir + tenant.code);
          // Query the entry
          var stats = fs.lstatSync(reports_dir + tenant.code);
          // Is it a directory?
          if (stats.isDirectory()) {
            fs.listAll(reports_dir + tenant.code, { filter: filter , sort: compare}, callback);
          }
        } catch (e) {
          logger.info('Error - ');
          logger.info(JSON.stringify(e));
          callback(null, []);
        }
      }
    });
   }

}

function read(filename, callback) {
  var fileparts = filename.split('_');
  var reports_dir = config.reports.storage_path;
  var file = reports_dir + fileparts[1] + '/' + filename;
  logger.info('File - ' + file);
  fs.stat(file, function (err, stat) {
    callback(err, file);
  });
}
