'use strict';

var meta = require('./meta');
var async = require('async');
var logger = require('./logger/logger').logger;
var provider = require('./provider/provider').getProvider();
var extend = require('util')._extend;

var getPictograms = function getPictograms(searchRequest, options, callback) {
  logger.debug('getPictograms: ', searchRequest);

  try {
    provider.getPictograms(searchRequest, function (err, pictograms) {

      if (err) {
        logger.debug('Unable to get pictograms: ', err);
        return callback(err);
      }

      return callback(null, pictograms);
    });
  }
  catch (e) {
    logger.warn('unable to get pictograms for: ', searchRequest, e);
    return callback(e);
  }
};

var createClipboard = function createClipboard(newFestival, options, callback) {
  logger.debug('createClipboard: ', newFestival);

  try {
    provider.createClipboard(newFestival, function (err, clipboard) {

      if (err) {
        logger.debug('Unable to create clipboard: ', clipboard, err);
        return callback(err);
      }

      return callback(null, clipboard);
    });
  }
  catch (e) {
    logger.warn('unable to create clipboard: ', e);
    return callback(e);
  }
};

var getClipboard = function getClipboard(id, options, callback) {
  logger.debug('getClipboard: ', id);

  try {
    provider.getClipboard(id, function (err, clipboard) {

      if (err) {
        logger.debug('Unable to get clipboard: ', err);
        return callback(err);
      }

      return callback(null, clipboard);
    });
  }
  catch (e) {
    logger.warn('unable to get clipboard for id: ', id, e);
    return callback(e);
  }
};

var getClipboards = function getClipboards(searchRequest, options, callback) {
  logger.debug('getClipboards: ', searchRequest);

  try {
    provider.getClipboards(searchRequest, function (err, clipboard) {

      if (err) {
        logger.debug('Unable to get clipboard: ', err);
        return callback(err);
      }

      return callback(null, clipboard);
    });
  }
  catch (e) {
    logger.warn('unable to get clipboards for: ', searchRequest, e);
    return callback(e);
  }
};

var deleteClipboard = function deleteClipboard(id, options, callback) {
  logger.debug('deleteClipboard: ', id);

  try {
    provider.deleteClipboard(id, function (err, clipboard) {

      if (err) {
        logger.debug('Unable to delete clipboard: ', err);
        return callback(err);
      }

      return callback(null, clipboard);
    });
  }
  catch (e) {
    logger.warn('unable to delete clipboard for id: ', id, e);
    return callback(e);
  }
};

module.exports = {
  VERSION: meta.VERSION,
  createClipboard: createClipboard,
  getClipboards: getClipboards,
  getClipboard: getClipboard,
  getPictograms: getPictograms,
  deleteClipboard: deleteClipboard
};
