'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Dashboard Schema
 */
var DashboardEseriesSystemSchema = new Schema({
  storage_system: {
    type: String,
    default: '',
    trim: true
  },
  wwn: {
    type: String,
    default: '',
    trim: true
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

mongoose.model('eseries_system_health', DashboardEseriesSystemSchema);