'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Dashboard Schema
 */
var DashboardEseriesVolumeSchema = new Schema({
  storage_system: {
    type: String,
    default: '',
    trim: true
  },
  name: {
    type: String,
    default: '',
    trim: true
  },
  id: {
    type: String,
    default: '',
    trim: true,
  },
  thin_provisioned: {
    type: Boolean,
    default: false,
  },
  capacity: {
    type: Number,
    default: 0,
  },
  mapped: {
    type: Boolean,
    default: false,
  },
  offline: {
    type: Boolean,
    default: false,
  },
  volume_full: {
    type: Boolean,
    default: false,
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

mongoose.model('eseries_volume_health', DashboardEseriesVolumeSchema);