'use strict';

var async = require('async');
var logger = require('../logger/logger').logger;

var clipboardsModel = require('xclipboard-model');
var ServiceUnavailableError = clipboardsModel.error.ServiceUnavailableError;

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

  var updateFestival = function updateFestival(clipboardId, newFestival, callback) {
    logger.args('updateFestival: ', arguments);

    es.update(clipboardId, newFestival, config.elasticsearch.clipboards,
      function (error, result) {

        if (error) {
          logger.warn('Unable to update clipboard', error);
          return callback(new ServiceUnavailableError('Unable to update clipboard'));
        }

        return callback(null, error, result);
      });
  };

  var getClipboard = function getClipboard(clipboardId, callback) {
    logger.args('getClipboard: ', arguments);

    es.get(clipboardId, config.elasticsearch.clipboards,
      function (error, result) {

        if (error) {
          logger.warn('Unable to get clipboard', error);
          return callback(new ServiceUnavailableError('Unable to get clipboard'));
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
              return callback(new ServiceUnavailableError('Unable to create clipboard event'));
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

  var createClipboardEvent = function createClipboardEvent(clipboardId, newEvent, callback) {
    logger.args('createClipboardEvent: ', arguments);

    var id = newEvent.id;

    es.create(id, newEvent, config.elasticsearch.events,
      function (error, result) {

        if (error) {
          logger.warn('Unable to create clipboard event', error);
          return callback(new ServiceUnavailableError('Unable to create clipboard event'));
        }

        return callback(null, result);
      });
  };

  var updateFestivalEvent = function updateFestivalEvent(clipboardId, eventId, newEvent, callback) {
    logger.args('updateFestivalEvent: ', arguments);

    es.update(eventId, newEvent, config.elasticsearch.events,
      function (error, result) {

        if (error) {
          logger.warn('Unable to update clipboard event', error);
          return callback(new ServiceUnavailableError('Unable to update clipboard event'));
        }

        return callback(null, result);
      });
  };

  var getClipboardEvents = function getClipboardEvents(clipboardId, searchRequest, callback) {
    logger.args('getClipboardEvents: ', arguments);

    var results = {
      total: 0,
      events: []
    };

    searchRequest.clipboard = clipboardId;

    es.search(getElasticSearchFilters(searchRequest), config.elasticsearch.events,
      function (error, result) {

        if (error) {
          logger.warn('Unable to get clipboard events', error);
          return callback(new ServiceUnavailableError('Unable to get clipboard events'));
        }

        if (result.hits && result.hits.total > 0 && result.hits.hits) {
          async.map(result.hits.hits, getSource, function (errHits, events) {
            if (errHits) {
              logger.warn('Unable to get results: ', errHits);
              return callback(new ServiceUnavailableError('Unable to create clipboard event'));
            }

            results.total = result.hits.total;
            results.events = events;
            return callback(null, results);
          });
        }
        else {
          return callback(null, results);
        }
      });
  };

  var getClipboardEvent = function getClipboardEvent(clipboardId, eventId, callback) {
    logger.args('getClipboardEvent: ', arguments);

    es.get(eventId, config.elasticsearch.events,
      function (error, result) {

        if (error) {
          logger.warn('Unable to get clipboard event', error);
          return callback(new ServiceUnavailableError('Unable to get clipboard event'));
        }

        return callback(null, result);
      });
  };

  var deleteClipboardEvent = function deleteClipboardEvent(clipboardId, eventId, callback) {
    logger.args('deleteClipboardEvent: ', arguments);

    es.remove(eventId, config.elasticsearch.events,
      function (error, result) {

        if (error) {
          logger.warn('Unable to delete clipboard event', error);
          return callback(new ServiceUnavailableError('Unable to delete clipboard event'));
        }

        return callback(null, result);
      });
  };

  var createClipboardPlace = function createClipboardPlace(clipboardId, newPlace, callback) {
    logger.args('createClipboardPlace: ', arguments);

    var id = newPlace.id;

    es.create(id, newPlace, config.elasticsearch.places,
      function (error, result) {

        if (error) {
          logger.warn('Unable to add clipboard place', error);
          return callback(new ServiceUnavailableError('Unable to create clipboard place'));
        }

        return callback(null, result);
      });
  };

  var updateFestivalPlace = function updateFestivalPlace(clipboardId, placeId, newPlace, callback) {
    logger.args('updateFestivalPlace: ', arguments);

    es.update(placeId, newPlace, config.elasticsearch.places,
      function (error, result) {

        if (error) {
          logger.warn('Unable to update clipboard place', error);
          return callback(new ServiceUnavailableError('Unable to update clipboard place'));
        }

        return callback(null, result);
      });
  };

  var getClipboardPlaces = function getClipboardPlaces(clipboardId, searchRequest, callback) {
    logger.args('getClipboardPlaces: ', arguments);

    var results = {
      total: 0,
      places: []
    };

    searchRequest.clipboard = clipboardId;

    es.search(getElasticSearchFilters(searchRequest), config.elasticsearch.places,
      function (error, result) {

        if (error) {
          logger.warn('Unable to get clipboard places', error);
          return callback(new ServiceUnavailableError('Unable to get clipboard places'));
        }

        if (result.hits && result.hits.total > 0 && result.hits.hits) {
          async.map(result.hits.hits, getSource, function (errHits, places) {
            if (errHits) {
              logger.warn('Unable to get results: ', errHits);
              return callback(new ServiceUnavailableError('Unable to create clipboard event'));
            }

            results.total = result.hits.total;
            results.places = places;
            return callback(null, results);
          });
        }
        else {
          return callback(null, results);
        }
      });
  };

  var getClipboardPlace = function getClipboardPlace(clipboardId, placeId, callback) {
    logger.args('getClipboardPlace: ', arguments);

    es.get(placeId, config.elasticsearch.places,
      function (error, result) {

        if (error) {
          logger.warn('Unable to get clipboard place', clipboardId, placeId, error);
          return callback(new ServiceUnavailableError('Unable to get clipboard place'));
        }

        return callback(null, result);
      });
  };

  var deleteClipboardPlace = function deleteClipboardPlace(clipboardId, placeId, callback) {
    logger.args('deleteClipboardPlace: ', arguments);

    es.remove(placeId, config.elasticsearch.places,
      function (error, result) {

        if (error) {
          logger.warn('Unable to delete clipboard place', clipboardId, placeId, error);
          return callback(new ServiceUnavailableError('Unable to delete clipboard place'));
        }

        return callback(null, result);
      });
  };

  var createClipboardCategory = function createClipboardCategory(clipboardId, newCategory, callback) {
    logger.args('createClipboardCategory: ', arguments);

    var id = newCategory.id;

    es.create(id, newCategory, config.elasticsearch.categories,
      function (error, result) {

        if (error) {
          logger.warn('Unable to add clipboard category', error);
          return callback(new ServiceUnavailableError('Unable to create clipboard category'));
        }

        return callback(null, result);
      });
  };

  var updateFestivalCategory = function updateFestivalCategory(clipboardId, categoryId, newCategory, callback) {
    logger.args('updateFestivalCategory: ', arguments);

    es.update(categoryId, newCategory, config.elasticsearch.categories,
      function (error, result) {

        if (error) {
          logger.warn('Unable to update clipboard category', error);
          return callback(new ServiceUnavailableError('Unable to update clipboard category'));
        }

        return callback(null, result);
      });
  };

  var getClipboardCategories = function getClipboardCategories(clipboardId, searchRequest, callback) {
    logger.args('getClipboardCategories: ', arguments);

    var results = {
      total: 0,
      categories: []
    };

    searchRequest.clipboard = clipboardId;

    es.search(getElasticSearchFilters(searchRequest), config.elasticsearch.categories,
      function (error, result) {

        if (error) {
          logger.warn('Unable to get clipboard categories', error);
          return callback(new ServiceUnavailableError('Unable to get clipboard categories'));
        }

        if (result.hits && result.hits.total > 0 && result.hits.hits) {
          async.map(result.hits.hits, getSource, function (errHits, categories) {
            if (errHits) {
              logger.warn('Unable to get results: ', errHits);
              return callback(new ServiceUnavailableError('Unable to create clipboard event'));
            }

            results.total = result.hits.total;
            results.categories = categories;
            return callback(null, results);
          });
        }
        else {
          return callback(null, results);
        }
      });
  };

  var getClipboardCategory = function getClipboardCategory(clipboardId, categoryId, callback) {
    logger.args('getClipboardCategory: ', arguments);

    es.get(categoryId, config.elasticsearch.categories,
      function (error, result) {

        if (error) {
          logger.warn('Unable to get clipboard category', error);
          return callback(new ServiceUnavailableError('Unable to get clipboard category'));
        }

        return callback(null, result);
      });
  };

  var deleteClipboardCategory = function deleteClipboardCategory(clipboardId, categoryId, callback) {
    logger.args('deleteClipboardCategory: ', arguments);

    es.remove(categoryId, config.elasticsearch.categories,
      function (error, result) {

        if (error) {
          logger.warn('Unable to delete clipboard category', error);
          return callback(new ServiceUnavailableError('Unable to delete clipboard category'));
        }

        return callback(null, result);
      });
  };

  var createNews = function createNews(newNews, callback) {
    logger.args('createNews: ', arguments);

    var id = newNews.id;

    es.create(id, newNews, config.elasticsearch.news,
      function (error, result) {

        if (error) {
          logger.warn('Unable to add news', error);
          return callback(new ServiceUnavailableError('Unable to add news'));
        }

        return callback(null, result);
      });
  };

  var updateNews = function updateNews(newsId, newNews, callback) {
    logger.args('updateNews: ', arguments);

    es.update(newsId, newNews, config.elasticsearch.news,
      function (error, result) {

        if (error) {
          logger.warn('Unable to update news', error);
          return callback(new ServiceUnavailableError('Unable to update clipboard news'));
        }

        return callback(null, result);
      });
  };

  var getNewsCollection = function getNewsCollection(searchRequest, callback) {
    logger.args('getNewsCollection: ', arguments);

    var results = {
      total: 0,
      news: []
    };

    es.search(getElasticSearchFilters(searchRequest), config.elasticsearch.news,
      function (error, result) {

        if (error) {
          logger.warn('Unable to get news', error);
          return callback(new ServiceUnavailableError('Unable to get news'));
        }

        if (result.hits && result.hits.total > 0 && result.hits.hits) {
          async.map(result.hits.hits, getSource, function (errHits, news) {
            if (errHits) {
              logger.warn('Unable to get results: ', errHits);
              return callback(new ServiceUnavailableError('Unable to create clipboard event'));
            }

            results.total = result.hits.total;
            results.news = news;
            return callback(null, results);
          });
        }
        else {
          return callback(null, results);
        }
      });
  };

  var getNews = function getNews(newsId, callback) {
    logger.args('getNews: ', arguments);

    es.get(newsId, config.elasticsearch.news,
      function (error, result) {

        if (error) {
          logger.warn('Unable to get news', error);
          return callback(new ServiceUnavailableError('Unable to get news'));
        }

        return callback(null, result);
      });
  };

  var deleteNews = function deleteNews(newsId, callback) {
    logger.args('deleteNews: ', arguments);

    es.remove(newsId, config.elasticsearch.news,
      function (error, result) {

        if (error) {
          logger.warn('Unable to delete clipboard news', error);
          return callback(new ServiceUnavailableError('Unable to delete news'));
        }

        return callback(null, result);
      });
  };

  return {
    createClipboard: createClipboard,
    getPictograms: getPictograms,
    getClipboard: getClipboard,
    deleteClipboard: deleteClipboard
  };
};

module.exports = {
  provider: provider
};
