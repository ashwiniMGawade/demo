'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  path = require('path'),
  mongoose = require('mongoose'),
  Tenant = mongoose.model('Tenant'),
  Server = mongoose.model('Server'),
  Storagegroup = mongoose.model('Storagegroup'),
  Subscription = mongoose.model('Subscription'),
  Storageunit = mongoose.model('Storageunit'),
  Icr = mongoose.model('Icr'),
  NotificationSchema = mongoose.model('Notification'),
  User = mongoose.model('User');

/**
 * List of Allowed Status
 */
exports.listStatus = function (req, res) {
  res.json(Server.schema.path('status').enumValues);
};

exports.listSGStatus = function (req, res) {
  res.json(Storagegroup.schema.path('status').enumValues);
};

exports.listSUStatus = function (req, res) {
  res.json(Storageunit.schema.path('status').enumValues);
};

exports.listManaged = function (req, res) {
  res.json(Server.schema.path('managed').enumValues);
};

exports.listProtocol = function (req, res) {
  res.json(Storageunit.schema.path('protocol').enumValues);
};

exports.listLunOs = function (req, res) {
  res.json(Storageunit.schema.path('lunOs').enumValues);
};

exports.listICMStatus = function (req, res) {
  res.json(Icr.schema.path('status').enumValues);
};

exports.listNotificationCategory = function (req, res) {
  res.json(NotificationSchema.schema.path('category').enumValues);
};

exports.listProvider = function (req, res) {
  res.json(User.schema.path('provider').enumValues);
};

exports.listStoragePackClasses = function (req, res) {
  res.json(Subscription.schema.path('storagePack').schema.path('class').enumValues);
};
