'use strict';

var config = require('config');

var provider = null;

var getProvider = function getProvider() {

  if (!provider) {
    switch (config.provider.selected) {
      case 'elasticsearch':
        var esClient = require('../elasticsearch/client').connect();
        var es = require('../elasticsearch/es').es(esClient);
        provider = require('./elasticsearchProvider').provider(es, config);
        break;
      default :
        throw Error('Unknown provider: ' + config.provider.selected);
    }
  }

  return provider;
};

module.exports = {
  getProvider: getProvider
};