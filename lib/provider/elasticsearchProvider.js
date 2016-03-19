'use strict';

var async = require('async');
var logger = require('../logger/logger').logger;

var clipboardsModel = require('xclipboard-model');
var ServiceUnavailableError = clipboardsModel.error.ServiceUnavailableError;
var ClipboardNotFoundError = clipboardsModel.error.ClipboardNotFoundError;

var provider = function provider(es, config) {
  var getElasticSearchFilters = function getElasticSearchFilters(searchParameters) {

    var searchData = {
      query: {
        filtered: {
          query: {
            match_all: {}
          }
        }
      }
    };

    if (searchParameters.hasOwnProperty('limit') && searchParameters.limit > 0) {
      searchData.size = searchParameters.limit;
    }

    if (searchParameters.hasOwnProperty('offset') && searchParameters.offset > 0) {
      searchData.from = searchParameters.offset;
    }

    var filters = [];

    for (var name in searchParameters) {
      if (searchParameters.hasOwnProperty(name)) {
        var value = searchParameters[name];

        if (value && name !== 'limit' && name !== 'offset' && name !== 'sort') {
          var term = {
            term: {}
          };

          term.term[name] = value;
          filters.push(term);
        }
      }
    }

    if (filters && filters.length > 0) {
      searchData.query.filtered.filter = {
        and: filters
      };
    }

    if (filters && filters.length > 0) {
      searchData.query.filtered.filter = {
        and: filters
      };
    }

    if (searchParameters.hasOwnProperty('sort') && searchParameters.sort) {
      var sort = {};

      var re = /([+-])?(.+)/;
      var matches = searchParameters.sort.match(re);

      if (matches) {
        var order = 'asc';

        if (matches[1] === '-') {
          order = 'desc';
        }

        var field = matches[2].trim();

        sort[field] = {'order': order};
        searchData.sort = [sort];
      }
    }

    return searchData;
  };

  var getSource = function getSource(data, callback) {
    return callback(null, data._source);
  };

  var createClipboard = function createClipboard(newFestival, callback) {
    logger.args('createClipboard: ', arguments);

    var clipboardId = newFestival.id;

    es.create(clipboardId, newFestival, config.elasticsearch.clipboards,
      function (error/*, result*/) {

        if (error) {
          logger.warn('Unable to add clipboard', error);
          return callback(new ServiceUnavailableError('Unable to add clipboard'));
        }

        return callback(null, newFestival);
      });
  };

  var getClipboard = function getClipboard(clipboardId, callback) {
    logger.args('getClipboard: ', arguments);

    es.get(clipboardId, config.elasticsearch.clipboards,
      function (error, result) {

        if (error) {

          if (error.hasOwnProperty('status') && error.status === 404) {
            logger.warn('Unable to get clipboard', error);
            return callback(new ClipboardNotFoundError('Clipboard not found'));
          }
          else {
            logger.warn('Unable to get clipboard', error);
            return callback(new ServiceUnavailableError('Unable to get clipboard'));
          }
        }

        return callback(null, result);
      });
  };

  var deleteClipboard = function deleteClipboard(clipboardId, callback) {
    logger.args('deleteClipboard: ', arguments);

    es.remove(clipboardId, config.elasticsearch.clipboards,
      function (error, result) {

        if (error) {
          logger.warn('Unable to delete clipboard', error);
          return callback(new ServiceUnavailableError('Unable to delete clipboard'));
        }

        return callback(null, result);
      });
  };

  var getPictograms = function getPictograms(searchRequest, callback) {
    logger.args('getPictograms: ', arguments);

    var results = {
      total: 0,
      pictograms: []
    };

    es.search(getElasticSearchFilters(searchRequest), config.elasticsearch.pictograms,
      function (error, result) {

        if (error) {
          logger.warn('Unable to get pictograms', error);
          return callback(new ServiceUnavailableError('Unable to get pictograms'));
        }

        if (result.hits && result.hits.total > 0 && result.hits.hits) {
          async.map(result.hits.hits, getSource, function (errHits, pictograms) {
            if (errHits) {
              logger.warn('Unable to get results: ', errHits);
              return callback(new ServiceUnavailableError('Unable to get pictograms'));
            }

            results.total = result.hits.total;
            results.pictograms = pictograms;
            return callback(null, results);
          });
        }
        else {
          return callback(null, results);
        }
      });
  };


  var getClipboards = function getClipboards(searchRequest, callback) {
    logger.args('getClipboards: ', arguments);

    var results = {
      total: 0,
      clipboards: []
    };

    es.search(getElasticSearchFilters(searchRequest), config.elasticsearch.clipboards,
      function (error, result) {

        if (error) {
          logger.warn('Unable to get clipboard', error);
          return callback(new ServiceUnavailableError('Unable to get clipboard'));
        }

        if (result.hits && result.hits.total > 0 && result.hits.hits) {
          async.map(result.hits.hits, getSource, function (errHits, clipboards) {
            if (errHits) {
              logger.warn('Unable to get results: ', errHits);
              return callback(new ServiceUnavailableError('Unable to get clipboard'));
            }

            results.total = result.hits.total;
            results.clipboards = clipboards;
            return callback(null, results);
          });
        }
        else {
          return callback(null, results);
        }
      });
  };

  return {
    createClipboard: createClipboard,
    getClipboards: getClipboards,
    getPictograms: getPictograms,
    getClipboard: getClipboard,
    deleteClipboard: deleteClipboard
  };
};

module.exports = {
  provider: provider
};
