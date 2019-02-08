'use strict';

// NSE
var path = require('path'),
    labels = require(path.resolve('./config/labels')),
    wfaServer = process.env.WFA_SERVER_HOST,
    constants = require('constants'),
    APIserviceHost = process.env.API_SERVICE_HOST;

module.exports = {
  app: {
    title: labels.app.title,
    description: 'NetApp Service Engine',
    keywords: 'netapp, nse, dfaas, data-fabric, datafabric, flexpod, cloud',
    googleAnalyticsTrackingID: process.env.GOOGLE_ANALYTICS_TRACKING_ID || 'GOOGLE_ANALYTICS_TRACKING_ID'
  },
  db: {
    promise: global.Promise
  },
  port: process.env.PORT || 3000,
  host: process.env.HOST || '0.0.0.0',
  // DOMAIN config should be set to the fully qualified application accessible
  // URL. For example: https://www.myapp.com (including port if required).
  domain: process.env.DOMAIN,
  // Session Cookie settings
  sessionCookie: {
    // session expiration is set by default to 24 hours
    maxAge: 24 * (60 * 60 * 1000),
    // httpOnly flag makes sure the cookie is only accessed
    // through the HTTP protocol and not JS/browser
    httpOnly: true,
    // secure cookie should be turned to true to provide additional
    // layer of security so that the cookie is set only when working
    // in HTTPS mode.
    secure: false
  },
  // sessionSecret should be changed for security measures and concerns
  sessionSecret: process.env.SESSION_SECRET || 'MEAN',
  // sessionKey is the cookie session name
  sessionKey: 'sessionId',
  sessionCollection: 'sessions',
  // Lusca config
  csrf: {
    csrf: false,
    csp: false,
    xframe: 'SAMEORIGIN',
    p3p: 'ABCDEF',
    xssProtection: true
  },
  logo: 'modules/core/client/img/brand/logo.png',
  favicon: 'modules/core/client/img/brand/favicon.ico',
  illegalUsernames: ['meanjs', 'administrator', 'password', 'admin', 'user',
    'unknown', 'anonymous', 'null', 'undefined', 'api'
  ],
  aws: {
    s3: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      bucket: process.env.S3_BUCKET
    }
  },
  uploads: {
    // Storage can be 'local' or 's3'
    storage: process.env.UPLOADS_STORAGE || 'local',
    profile: {
      image: {
        dest: './modules/users/client/img/profile/uploads/',
        limits: {
          fileSize: 1 * 1024 * 1024 // Max file size in bytes (1 MB)
        }
      }
    }
  },
  shared: {
    owasp: {
      allowPassphrases: true,
      maxLength: 128,
      minLength: 10,
      minPhraseLength: 20,
      minOptionalTestsToPass: 4
    }
  },

  // NSE
  templateEngine: 'swig',
  logoWhite: 'modules/core/client/img/brand/logo-white.png',
  // NSE: Managed Services distribution list
  icrDistList : 'managedservices@netapp.com',
  netappBCCMailer: process.env.NETAPP_BCC_EMAIL || '',
  // NSE: Reports settings - storage path, default number of reports shown
  reports: {
    storage_path : process.env.REPORTS_STORAGE_PATH,
    default_records : 30,
    report_generation_time_UTC: {
      hours:process.env.REPORTS_GRNERATION_TIME_IN_HOURS || '17',
      minutes:'0'
    }
  },
  // NSE: IDP settings - entryPoint, call back, cert etc.
  idp: {
    path: process.env.IDP_CALLBACK_URL,  // e.g '/login/callback'
    entryPoint: process.env.IDP_ENTRYPOINT_URL, // e.g 'https://10.128.113.126:9443/samlsso'
    logoutUrl: process.env.IDP_LOGOUT_URL, // e.g 'https://10.128.113.126:9443/samlsso'
    cert: process.env.IDP_CERT || "test", // e.g  'MIICNTCCAZ6gA...
    privateCertFile: './cert.pem',
    identifierFormat: process.env.IDP_IDENTIFIERFORMAT,
    issuer:process.env.IDP_ISSUER
  },
  // NSE: WFA Settings
  wfa: {
    vFasCreateJob: 'https://'+wfaServer+'/rest/workflows/d98d9a2f-7f2b-4b24-a07a-c2b12a048124/jobs',
    vFasDeleteJob: 'https://'+wfaServer+'/rest/workflows/0d66d68c-fd34-4104-8fe4-95f5845652a8/jobs',
    vFasUpdateJob: 'https://'+wfaServer+'/rest/workflows/6287d29f-b7fc-46bb-ae21-7cdd7ff421e5/jobs',
    sgCreateJob: 'https://'+wfaServer+'/rest/workflows/175850ec-33bb-4fa2-83f6-f4ba814e436f/jobs',
    sgDeleteJob: 'https://'+wfaServer+'/rest/workflows/58ad17a6-dab8-46fa-85a7-d6c0c404dd67/jobs',
    sgUpdateJob: 'https://'+wfaServer+'/rest/workflows/e2b51796-a9c4-426d-8406-f13ea3151c16/jobs',
    sgRevertJob: 'https://'+wfaServer+'/rest/workflows/5668aedb-b4c0-404b-88e2-07a7a76cb460/jobs',
    sgCloneJob: 'https://'+wfaServer+'/rest/workflows/eed71837-0458-47be-8310-ee05f972fcbf/jobs',
    suCreateJob: 'https://'+wfaServer+'/rest/workflows/fcaf54f5-8265-480b-a99d-01991813be6c/jobs',
    suDeleteJob: 'https://'+wfaServer+'/rest/workflows/370c9c78-1b2c-4156-b1b3-6faf8e8d6309/jobs',
    suUpdateJob: 'https://'+wfaServer+'/rest/workflows/f3f82faf-6d1d-4b6c-a5ce-ee9c4ef7bf67/jobs',
    authorization:process.env.WFA_SERVER_AUTHORIZATION,
    sql: {
      connectionLimit : 5,
      host: wfaServer,
      user: process.env.WFA_SERVER_MYSQL_USERNAME,
      password: process.env.WFA_SERVER_MYSQL_PASSWORD ,
      database: process.env.WFA_SERVER_MYSQL_DATABASE 
    },
    refreshRate: '30000',
    getUUIDtrials: 20,
    httpsClientOptions: {
      connection: {
          secureOptions: constants.SSL_OP_NO_SSLv2|constants.SSL_OP_NO_SSLv3|constants.SSL_OP_NO_TLSv1, // Disable SSL2/SSL3/TLS1.
          ciphers: constants.defaultCoreCipherList + ':EDH-RSA-DES-CBC3-SHA:DES-CBC3-SHA', // Add two ciphers for WFA 4.0.
          rejectUnauthorized: false, // Accept self-signed certs.
          honorCipherOrder: true
      }
    }
  },
  // NSE
  APIservice : {
    'authorization' : process.env.API_SERVICE_AUTHORIZATION,
    'serverDetails' : 'https://' + APIserviceHost + ':8443/api/1.0/ontap/storage-vms',
    'volumeDetails' : 'https://' + APIserviceHost + ':8443/api/1.0/ontap/volumes',
    'snapshotBaseUrl' : 'https://' + APIserviceHost + ':8443/api/1.0/ontap/snapshots'
  },
  // NSE
  graphite : {
      url : process.env.DFFAS_GRAFANA_URL,
      apikey: process.env.DFFAS_GRAFANA_API_KEY,
      target : {
        top5 : {
          capacity : "target=highestAverage(netapp.tenant.telstra.svm.*.perf.vol_summary.total_ops,5)",
          iops : "target=highestAverage(netapp.tenant.telstra.svm.*.perf.vol_summary.total_ops,5)",
          throughput : "target=highestAverage(netapp.tenant.telstra.svm.*.perf.vol_summary.total_ops,5)",
          latency : "target=highestAverage(netapp.tenant.telstra.svm.*.perf.vol_summary.total_ops,5)"
        },

        tenant : {
          capacity : "target=alias(sumSeries(netapp.tenant.#Tenant.svm.*.capacity.vol_summary.afs_total), 'Total')&target=alias(sumSeries(netapp.tenant.#Tenant.svm.*.capacity.vol_summary.afs_used), 'Used')",
          iops : "target=alias(removeAbovePercentile(sumSeries(netapp.tenant.#Tenant.svm.*.perf.vol_summary.total_ops),95), 'Total')&target=alias(removeAbovePercentile(sumSeries(netapp.tenant.#Tenant.svm.*.perf.vol_summary.read_ops),95), 'Read')&target=alias(removeAbovePercentile(sumSeries(netapp.tenant.#Tenant.svm.*.perf.vol_summary.write_ops),95), 'Write')&target=alias(removeAbovePercentile(sumSeries(netapp.tenant.#Tenant.svm.*.perf.vol_summary.other_ops),95), 'Other')",
          throughput : "target=alias(removeAbovePercentile(sumSeries(netapp.tenant.#Tenant.svm.*.perf.vol_summary.total_data),95), 'Total')&target=alias(removeAbovePercentile(sumSeries(netapp.tenant.#Tenant.svm.*.perf.vol_summary.read_data),95), 'Read')&target=alias(removeAbovePercentile(sumSeries(netapp.tenant.#Tenant.svm.*.perf.vol_summary.write_data),95), 'Write')",
          latency : "target=alias(removeAbovePercentile(sumSeries(netapp.tenant.#Tenant.svm.*.perf.vol_summary.read_latency),95), 'Read')&target=alias(removeAbovePercentile(sumSeries(netapp.tenant.#Tenant.svm.*.perf.vol_summary.write_latency),95), 'Write')&target=alias(removeAbovePercentile(sumSeries(netapp.tenant.#Tenant.svm.*.perf.vol_summary.avg_latency),95), 'Avg')"
        },

        volume : {
          capacity : "target=alias(netapp.tenant.#Tenant.svm.#SVM.capacity.vol.#Volume.actual_volume_size, 'Total')&target=alias(netapp.tenant.#Tenant.svm.#SVM.capacity.vol.#Volume.afs_used, 'Used')",
          throughput : "target=alias(removeAbovePercentile(netapp.tenant.#Tenant.svm.#SVM.perf.vol.#Volume.total_data,95), 'Total')&target=alias(removeAbovePercentile(netapp.tenant.#Tenant.svm.#SVM.perf.vol.#Volume.read_data,95), 'Read')&target=alias(removeAbovePercentile(netapp.tenant.#Tenant.svm.#SVM.perf.vol.#Volume.write_data,95), 'Write')",
          iops : "target=alias(removeAbovePercentile(netapp.tenant.#Tenant.svm.#SVM.perf.vol.#Volume.total_ops,95), 'Total')&target=alias(removeAbovePercentile(netapp.tenant.#Tenant.svm.#SVM.perf.vol.#Volume.read_ops,95), 'Read')&target=alias(removeAbovePercentile(netapp.tenant.#Tenant.svm.#SVM.perf.vol.#Volume.write_ops,95), 'Write')&target=alias(removeAbovePercentile(netapp.tenant.#Tenant.svm.#SVM.perf.vol.#Volume.other_ops,95), 'Other')",
          latency : "target=alias(removeAbovePercentile(netapp.tenant.#Tenant.svm.#SVM.perf.vol.#Volume.read_latency,95), 'Read')&target=alias(removeAbovePercentile(netapp.tenant.#Tenant.svm.#SVM.perf.vol.#Volume.write_latency,95), 'Write')&target=alias(removeAbovePercentile(netapp.tenant.#Tenant.svm.#SVM.perf.vol.#Volume.avg_latency,95), 'Avg')"
        },

        server : {
          capacity : "target=alias(netapp.tenant.#Tenant.svm.#SVM.capacity.vol_summary.actual_volume_size, 'Total')&target=alias(netapp.tenant.#Tenant.svm.#SVM.capacity.vol_summary.afs_used, 'Used')",
          throughput : "target=alias(removeAbovePercentile(netapp.tenant.#Tenant.svm.#SVM.perf.vol_summary.total_data,95), 'Total')&target=alias(removeAbovePercentile(netapp.tenant.#Tenant.svm.#SVM.perf.vol_summary.read_data,95), 'Read')&target=alias(removeAbovePercentile(netapp.tenant.#Tenant.svm.#SVM.perf.vol_summary.write_data,95), 'Write')",
          iops : "target=alias(removeAbovePercentile(netapp.tenant.#Tenant.svm.#SVM.perf.vol_summary.total_ops,95), 'Total')&target=alias(removeAbovePercentile(netapp.tenant.#Tenant.svm.#SVM.perf.vol_summary.read_ops,95), 'Read')&target=alias(removeAbovePercentile(netapp.tenant.#Tenant.svm.#SVM.perf.vol_summary.write_ops,95), 'Write')&target=alias(removeAbovePercentile(netapp.tenant.#Tenant.svm.#SVM.perf.vol_summary.other_ops,95), 'Other')",
          latency : "target=alias(removeAbovePercentile(netapp.tenant.#Tenant.svm.#SVM.perf.vol_summary.read_latency,95), 'Read')&target=alias(removeAbovePercentile(netapp.tenant.#Tenant.svm.#SVM.perf.vol_summary.write_latency,95), 'Write')&target=alias(removeAbovePercentile(netapp.tenant.#Tenant.svm.#SVM.perf.vol_summary.avg_latency,95), 'Avg')"
        }
      }
  },
  go : {
    'api_host':process.env.GO_API_HOST
  },
  ldap : {
    'url': process.env.LDAP_URL,
    'bindDN': process.env.LDAP_BIND_DN,
    'bindCredentials': process.env.LDAP_BIND_CREDENTIALS,
    'searchBase': process.env.LDAP_SEARCH_BASE,
    'searchFilterAttr': process.env.LDAP_SEARCH_FILTER_ATTR
  }
};
