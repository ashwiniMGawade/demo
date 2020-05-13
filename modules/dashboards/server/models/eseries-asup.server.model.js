'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Dashboard Schema
 */
var DashboardEseriesAsupSchema = new Schema({
  storage_system: {
    type: String,
    default: '',
    trim: true
  },
  asup_capable: {
    type: Boolean,
    default: false
  },
  asup_enabled: {
    type: Boolean,
    default: false
  },
  ondemand_capable: {
    type: Boolean,
    default: false
  },
  ondemand_enabled: {
    type: Boolean,
    default: false
  },
  destination_address: {
    type: String,
    default: '',
    trim: true
  },
  created: {
    type: Date,
    default: Date.now
  }
});

mongoose.model('eseries_asup_health', DashboardEseriesAsupSchema);