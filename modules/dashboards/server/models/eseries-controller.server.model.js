'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Dashboard Schema
 */
var DashboardEseriesControllerSchema = new Schema({
  storage_system: {
    type: String,
    default: '',
    trim: true
  },
  controller: {
    type: String,
    default: '',
    trim: true
  },
  ip_addresses: {
    type: String,
    default: '',
    trim: true,
  },
  active: {
    type: Boolean,
    default: false
  },
  quiesced:  {
    type: Boolean,
    default: false
  }, 
  status: {
    type: String,
    default: '',
    trim: true,
  },
  created: {
    type: Date,
    default: Date.now
  }
});

mongoose.model('eseries_controller_health', DashboardEseriesControllerSchema);