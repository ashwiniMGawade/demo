'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Dashboard Schema
 */
var DashboardEseriesPoolSchema = new Schema({
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
  offline: {
    type: Boolean,
    default: false,
  },
  state: {
    type: String,
    default: '',
    trim: true,
  },
  raid_level: {
    type: String,
    default: '',
    trim: true,
  },
  raid_status: {
    type: String,
    default: '',
    trim: true,
  },
  total_size: {
    type: Number,
    default: 0,
  },
  free_space: {
    type: Number,
    default: 0,
  },
  used_percentage: {
    type: Number,
    default: 0,
  },
  created: {
    type: Date,
    default: Date.now
  }
});

mongoose.model('eseries_pool_health', DashboardEseriesPoolSchema);