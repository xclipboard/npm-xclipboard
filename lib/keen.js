'use strict';

var Keen = require('keen-js');
var config = require('config');
var extend = require('util')._extend;
var logger = require('./logger/logger').logger;

var client = new Keen(config.keen);

var errorPictogram = function errorPictogram(action, auth, searchRequest, err) {
  logger.debug('save errorPictogram:', err);

  var event = extend(
    {
      keen: {
        timestamp: new Date().toISOString()
      },
      action: action,
      searchRequest: searchRequest,
      auth: auth
    }, err);

  client.addEvent('errorPictogram', event, function (errEvent) {
    if (errEvent) {
      logger.warn('errorPictogram save err:', errEvent);
    }
  });
};

var errorClipboard = function errorClipboard(action, auth, searchRequest, err) {
  logger.debug('save errorEvent:', err);

  var place = extend(
    {
      keen: {
        timestamp: new Date().toISOString()
      },
      action: action,
      searchRequest: searchRequest,
      auth: auth
    }, err);

  client.addEvent('errorClipboard', place, function (errEvent) {
    if (errEvent) {
      logger.warn('errorClipboard save err:', errEvent);
    }
  });
};

var pictogramsSearch = function pictogramsSearch(auth, searchRequest) {
  logger.debug('save pictogramsSearch:', searchRequest);

  var event = {
    keen: {
      timestamp: new Date().toISOString()
    },
    params: searchRequest,
    auth: auth
  };

  client.addEvent('pictogramsSearch', event, function (errEvent) {
    if (errEvent) {
      logger.warn('pictogramsSearch save err:', errEvent);
    }
  });
};

var clipboardsSearch = function clipboardsSearch(auth, searchRequest) {
  logger.debug('save clipboardsSearch:', searchRequest);

  var event = {
    keen: {
      timestamp: new Date().toISOString()
    },
    params: searchRequest,
    auth: auth
  };

  client.addEvent('clipboardsSearch', event, function (errEvent) {
    if (errEvent) {
      logger.warn('clipboardsSearch save err:', errEvent);
    }
  });
};

var getClipboard = function getClipboard(auth, params) {
  logger.debug('save getClipboard:', params);

  var event = {
    keen: {
      timestamp: new Date().toISOString()
    },
    params: params,
    auth: auth
  };

  client.addEvent('getClipboard', event, function (errEvent) {
    if (errEvent) {
      logger.warn('getClipboard save err:', errEvent);
    }
  });
};

var deleteClipboard = function deleteClipboard(auth, params) {
  logger.debug('save deleteClipboard:', params);

  var event = {
    keen: {
      timestamp: new Date().toISOString()
    },
    params: params,
    auth: auth
  };

  client.addEvent('deleteClipboard', event, function (errEvent) {
    if (errEvent) {
      logger.warn('deleteClipboard save err:', errEvent);
    }
  });
};

var clipboardsCreate = function clipboardsCreate(auth, params) {
  logger.debug('save clipboardsCreate:', params);

  var event = {
    keen: {
      timestamp: new Date().toISOString()
    },
    create: params,
    auth: auth
  };

  client.addEvent('clipboardsCreate', event, function (errEvent) {
    if (errEvent) {
      logger.warn('clipboardsCreate save err:', errEvent);
    }
  });
};

module.exports = {
  errorPictogram: errorPictogram,
  errorClipboard: errorClipboard,
  pictogramsSearch: pictogramsSearch,
  clipboardsCreate: clipboardsCreate,
  getClipboard: getClipboard,
  deleteClipboard: deleteClipboard,
  clipboardsSearch: clipboardsSearch
};