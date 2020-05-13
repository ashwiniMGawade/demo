'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Dashboard Schema
 */
var DashboardEseriesDriveSchema = new Schema({
  storage_system: {
    type: String,
    default: '',
    trim: true
  },
  id: {
    type: String,
    default: '',
    trim: true
  },
  type: {
    type: String,
    default: '',
    trim: true,
  },
  serial_number: {
    type: String,
    default: '',
    trim: true
  },
  removed:  {
    type: Boolean,
    default: false
  }, 
  status: {
    type: String,
    default: '',
    trim: true,
  },
  cause: {
    type: String,
    default: '',
    trim: true,
  },
  created: {
    type: Date,
    default: Date.now
  }
});

mongoose.model('eseries_drive_health', DashboardEseriesDriveSchema);