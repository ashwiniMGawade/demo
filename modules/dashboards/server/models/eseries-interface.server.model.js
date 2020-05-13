'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Dashboard Schema
 */
var DashboardEseriesInterfaceSchema = new Schema({
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
  interface: {
    type: String,
    default: '',
    trim: true,
  },
  type: {
    type: String,
    default: '',
    trim: true,
  },
  max_frame_size: {
    type: Number,
    default: 0,
  },
  current_speed: {
    type: String,
    default: '',
    trim: true,
  },
  max_speed: {
    type: String,
    default: '',
    trim: true,
  },
  degraded: {
    type: String,
    default: '',
    trim: true,
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

mongoose.model('eseries_interface_health', DashboardEseriesInterfaceSchema);