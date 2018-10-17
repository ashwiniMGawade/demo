'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Site Schema
 */
var SiteSchema = new Schema({
  name: {
    type: String,
    default: '',
    trim: true,
    unique: true,
    required: 'Site name required',
    minlength: [3, 'Name: Minimum 3 char required'],
    maxlength: [64, 'Name: Maximum 64 char allowed'],
    match: [/^[a-zA-Z0-9\ -]*$/, 'Site name can only include alphanumeric characters including space and dash'] 
  },
  code: {
    type: String,
    trim: true,
    unique: true,
    required: 'Site code required',
    minlength: [ 2, 'Code: Minimum 2 char required'],
    maxlength: [ 4, 'Code: Maximum 4 char allowed'],
    match: [ /^[a-z0-9]*$/ , 'Site code can only include lowercase alphanumeric characters']
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

SiteSchema.methods.toJSON = function() {
  var obj = this.toObject();
  obj.siteId = obj._id;
  delete obj.user;
  delete obj.created;
  delete obj._id;
  delete obj.__v;
  return obj;
};

mongoose.model('Site', SiteSchema);
