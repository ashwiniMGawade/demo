'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Dashboard Schema
 */
var DashboardSchema = new Schema({
  graphOrder: {
    type: String,
    default: '',
    trim: true
  },
  grafanaDB: {
    type: String,
    default: '',
    trim: true,
    required: 'Grafana Dashboard name required'
  },
  panelID: {
    type: String,
    default: '',
    lowercase: true,
    trim: true,
    required: 'PanelID required'
  },
  imgSize: {
    type: String,
    lowercase: true,
    trim: true,
    default: 'S'
  },
  params: [],  
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  created: {
    type: Date,
    default: Date.now
  }
});

mongoose.model('Dashboard', DashboardSchema);