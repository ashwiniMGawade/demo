'use strict';

var APIserviceHost = "10.128.115.95";

// Rename this file to local-NODE_ENV.js (i.e. local-development.js, or local-test.js) for having a local configuration variables that
// will not get commited and pushed to remote repositories.
// Use it for your API keys, passwords, etc.

// WARNING: When using this example for multiple NODE_ENV's concurrently, make sure you update the 'db' settings appropriately.
// You do not want to accidentally overwrite/lose any data. For instance, if you create a file for 'test' and don't change the
// database name in the setting below, running the tests will drop all the data from the specified database.
//
// You may end up with a list of files, that will be used with their corresponding NODE_ENV:
//
// local-development.js
// local-test.js
// local-production.js
//

/* For example (Development):

module.exports = {
  db: {
    uri: 'mongodb://localhost/local-dev',
    options: {}
  },
  sessionSecret: process.env.SESSION_SECRET || 'youshouldchangethistosomethingsecret',
  facebook: {
    clientID: process.env.FACEBOOK_ID || 'APP_ID',
    clientSecret: process.env.FACEBOOK_SECRET || 'APP_SECRET',
    callbackURL: '/api/auth/facebook/callback'
  }
};
*/

module.exports = {
  db: {
    // uri: process.env.MONGOHQ_URL || process.env.MONGODB_URI || 'mongodb://' + (process.env.DB_1_PORT_27017_TCP_ADDR || 'localhost') + '/mean-dev',
    // options: {    
    // }
    uri: "mongodb://dev-kubecluster.ausngs.netapp.au:32680/mean-dev",   //"mongodb://nse-docker01.ausngs.netapp.au/mean-dev",
    options: {
      user: "root",
      pass: "Netapp01!",
      auth: {
          authdb: 'admin'
      }      
    }
  },
  wfa: {
    authorization:"Basic YWRtaW46TmV0YXBwMDEh",
    sql: {
      connectionLimit : 5,
      host: "10.128.113.180",
      user: 'root',
      password: 'MH3SG5MYDD' ,
      database: 'cm_storage' 
    },
    refreshRate: '30000',
    getUUIDtrails: 10,
  },
  log: {
    format: process.env.LOG_FORMAT || 'combined',
  },
  sessionSecret: process.env.SESSION_SECRET || '9ecda0b08eb3d08de2570b41d2f597f9',
  livereload: false,
  go : {
    'api_host':process.env.GO_API_HOST || 'http://localhost:8080'
  },
  ldap : {
    'url': 'ldap://10.128.113.50:389' ,
    'bindDN': 'nse-dc-admin@ausngs.netapp.au',
    'bindCredentials': 'Qwerty1234%',
    'searchBase': 'cn=users,dc=ausngs,dc=netapp,dc=au',
    'searchFilterAttr': 'samaccountname'
  },
  APIservice : {
    'authorization' : process.env.API_SERVICE_AUTHORIZATION || "Basic YWRtaW46TmV0YXBwMTIzJA==",
    'serverDetails' : 'https://' + APIserviceHost + ':8443/api/1.0/ontap/storage-vms',
    'volumeDetails' : 'https://' + APIserviceHost + ':8443/api/1.0/ontap/volumes',
    'snapshotBaseUrl' : 'https://' + APIserviceHost + ':8443/api/1.0/ontap/snapshots'
  },
};
