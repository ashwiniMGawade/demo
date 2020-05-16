'use strict';

/**
 * Storage unit Module dependencies.
 */
var _ = require('lodash'),
  mongoose = require('mongoose'),
  path = require('path'),
  featuresSettings = require(path.resolve('./config/features')),
  logger = require(path.resolve('./config/lib/log')),
  Schema = mongoose.Schema;

/**
 * Storage unit Schema
 */
var PeerSchema = new Schema({
  sourceCluster: {
    type: String,
    default: '',
    trim: true,
  },
  sourceVserver: {
    type: String,
    default: '',
    trim: true,
  },
  peerCluster: {
    type: String,
    default: '',
    trim: true,
  },
  peerVserver: {
    type: String,
    default: '',
    trim: true,
  }, 
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  created: {
    type: Date,
    default: Date.now
  }
});


mongoose.model('ontap_peers', PeerSchema);
