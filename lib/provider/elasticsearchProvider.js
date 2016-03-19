'use strict';

var async = require('async');
var logger = require('../logger/logger').logger;

var festivalsModel = require('festivals-model');
var ServiceUnavailableError = festivalsModel.error.ServiceUnavailableError;

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

    if (searchParameters.limit > 0) {
      searchData.size = searchParameters.limit;
    }

    if (searchParameters.offset > 0) {
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

  var createFestival = function createFestival(newFestival, callback) {
    logger.args('createFestival: ', arguments);

    var festivalId = newFestival.id;

    es.create(festivalId, newFestival, config.elasticsearch.festivals,
      function (error/*, result*/) {

        if (error) {
          logger.warn('Unable to add festival', error);
          return callback(new ServiceUnavailableError('Unable to add festival'));
        }

        return callback(null, newFestival);
      });
  };

  var updateFestival = function updateFestival(festivalId, newFestival, callback) {
    logger.args('updateFestival: ', arguments);

    es.update(festivalId, newFestival, config.elasticsearch.festivals,
      function (error, result) {

        if (error) {
          logger.warn('Unable to update festival', error);
          return callback(new ServiceUnavailableError('Unable to update festival'));
        }

        return callback(null, error, result);
      });
  };

  var getFestival = function getFestival(festivalId, callback) {
    logger.args('getFestival: ', arguments);

    es.get(festivalId, config.elasticsearch.festivals,
      function (error, result) {

        if (error) {
          logger.warn('Unable to get festival', error);
          return callback(new ServiceUnavailableError('Unable to get festival'));
        }

        return callback(null, result);
      });
  };

  var deleteFestival = function deleteFestival(festivalId, callback) {
    logger.args('deleteFestival: ', arguments);

    es.remove(festivalId, config.elasticsearch.festivals,
      function (error, result) {

        if (error) {
          logger.warn('Unable to delete festival', error);
          return callback(new ServiceUnavailableError('Unable to delete festival'));
        }

        return callback(null, result);
      });
  };

  var getFestivals = function getFestivals(searchRequest, callback) {
    logger.args('getFestivals: ', arguments);

    var results = {
      total: 0,
      festivals: []
    };

    es.search(getElasticSearchFilters(searchRequest), config.elasticsearch.festivals,
      function (error, result) {

        if (error) {
          logger.warn('Unable to get festivals', error);
          return callback(new ServiceUnavailableError('Unable to get festivals'));
        }

        if (result.hits && result.hits.total > 0 && result.hits.hits) {
          async.map(result.hits.hits, getSource, function (errHits, festivals) {
            if (errHits) {
              logger.warn('Unable to get results: ', errHits);
              return callback(new ServiceUnavailableError('Unable to create festival event'));
            }

            results.total = result.hits.total;
            results.festivals = festivals;
            return callback(null, results);
          });
        }
        else {
          return callback(null, results);
        }
      });
  };

  var createFestivalEvent = function createFestivalEvent(festivalId, newEvent, callback) {
    logger.args('createFestivalEvent: ', arguments);

    var id = newEvent.id;

    es.create(id, newEvent, config.elasticsearch.events,
      function (error, result) {

        if (error) {
          logger.warn('Unable to create festival event', error);
          return callback(new ServiceUnavailableError('Unable to create festival event'));
        }

        return callback(null, result);
      });
  };

  var updateFestivalEvent = function updateFestivalEvent(festivalId, eventId, newEvent, callback) {
    logger.args('updateFestivalEvent: ', arguments);

    es.update(eventId, newEvent, config.elasticsearch.events,
      function (error, result) {

        if (error) {
          logger.warn('Unable to update festival event', error);
          return callback(new ServiceUnavailableError('Unable to update festival event'));
        }

        return callback(null, result);
      });
  };

  var getFestivalEvents = function getFestivalEvents(festivalId, searchRequest, callback) {
    logger.args('getFestivalEvents: ', arguments);

    var results = {
      total: 0,
      events: []
    };

    searchRequest.festival = festivalId;

    es.search(getElasticSearchFilters(searchRequest), config.elasticsearch.events,
      function (error, result) {

        if (error) {
          logger.warn('Unable to get festival events', error);
          return callback(new ServiceUnavailableError('Unable to get festival events'));
        }

        if (result.hits && result.hits.total > 0 && result.hits.hits) {
          async.map(result.hits.hits, getSource, function (errHits, events) {
            if (errHits) {
              logger.warn('Unable to get results: ', errHits);
              return callback(new ServiceUnavailableError('Unable to create festival event'));
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

  var getFestivalEvent = function getFestivalEvent(festivalId, eventId, callback) {
    logger.args('getFestivalEvent: ', arguments);

    es.get(eventId, config.elasticsearch.events,
      function (error, result) {

        if (error) {
          logger.warn('Unable to get festival event', error);
          return callback(new ServiceUnavailableError('Unable to get festival event'));
        }

        return callback(null, result);
      });
  };

  var deleteFestivalEvent = function deleteFestivalEvent(festivalId, eventId, callback) {
    logger.args('deleteFestivalEvent: ', arguments);

    es.remove(eventId, config.elasticsearch.events,
      function (error, result) {

        if (error) {
          logger.warn('Unable to delete festival event', error);
          return callback(new ServiceUnavailableError('Unable to delete festival event'));
        }

        return callback(null, result);
      });
  };

  var createFestivalPlace = function createFestivalPlace(festivalId, newPlace, callback) {
    logger.args('createFestivalPlace: ', arguments);

    var id = newPlace.id;

    es.create(id, newPlace, config.elasticsearch.places,
      function (error, result) {

        if (error) {
          logger.warn('Unable to add festival place', error);
          return callback(new ServiceUnavailableError('Unable to create festival place'));
        }

        return callback(null, result);
      });
  };

  var updateFestivalPlace = function updateFestivalPlace(festivalId, placeId, newPlace, callback) {
    logger.args('updateFestivalPlace: ', arguments);

    es.update(placeId, newPlace, config.elasticsearch.places,
      function (error, result) {

        if (error) {
          logger.warn('Unable to update festival place', error);
          return callback(new ServiceUnavailableError('Unable to update festival place'));
        }

        return callback(null, result);
      });
  };

  var getFestivalPlaces = function getFestivalPlaces(festivalId, searchRequest, callback) {
    logger.args('getFestivalPlaces: ', arguments);

    var results = {
      total: 0,
      places: []
    };

    searchRequest.festival = festivalId;

    es.search(getElasticSearchFilters(searchRequest), config.elasticsearch.places,
      function (error, result) {

        if (error) {
          logger.warn('Unable to get festival places', error);
          return callback(new ServiceUnavailableError('Unable to get festival places'));
        }

        if (result.hits && result.hits.total > 0 && result.hits.hits) {
          async.map(result.hits.hits, getSource, function (errHits, places) {
            if (errHits) {
              logger.warn('Unable to get results: ', errHits);
              return callback(new ServiceUnavailableError('Unable to create festival event'));
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

  var getFestivalPlace = function getFestivalPlace(festivalId, placeId, callback) {
    logger.args('getFestivalPlace: ', arguments);

    es.get(placeId, config.elasticsearch.places,
      function (error, result) {

        if (error) {
          logger.warn('Unable to get festival place', festivalId, placeId, error);
          return callback(new ServiceUnavailableError('Unable to get festival place'));
        }

        return callback(null, result);
      });
  };

  var deleteFestivalPlace = function deleteFestivalPlace(festivalId, placeId, callback) {
    logger.args('deleteFestivalPlace: ', arguments);

    es.remove(placeId, config.elasticsearch.places,
      function (error, result) {

        if (error) {
          logger.warn('Unable to delete festival place', festivalId, placeId, error);
          return callback(new ServiceUnavailableError('Unable to delete festival place'));
        }

        return callback(null, result);
      });
  };

  var createFestivalCategory = function createFestivalCategory(festivalId, newCategory, callback) {
    logger.args('createFestivalCategory: ', arguments);

    var id = newCategory.id;

    es.create(id, newCategory, config.elasticsearch.categories,
      function (error, result) {

        if (error) {
          logger.warn('Unable to add festival category', error);
          return callback(new ServiceUnavailableError('Unable to create festival category'));
        }

        return callback(null, result);
      });
  };

  var updateFestivalCategory = function updateFestivalCategory(festivalId, categoryId, newCategory, callback) {
    logger.args('updateFestivalCategory: ', arguments);

    es.update(categoryId, newCategory, config.elasticsearch.categories,
      function (error, result) {

        if (error) {
          logger.warn('Unable to update festival category', error);
          return callback(new ServiceUnavailableError('Unable to update festival category'));
        }

        return callback(null, result);
      });
  };

  var getFestivalCategories = function getFestivalCategories(festivalId, searchRequest, callback) {
    logger.args('getFestivalCategories: ', arguments);

    var results = {
      total: 0,
      categories: []
    };

    searchRequest.festival = festivalId;

    es.search(getElasticSearchFilters(searchRequest), config.elasticsearch.categories,
      function (error, result) {

        if (error) {
          logger.warn('Unable to get festival categories', error);
          return callback(new ServiceUnavailableError('Unable to get festival categories'));
        }

        if (result.hits && result.hits.total > 0 && result.hits.hits) {
          async.map(result.hits.hits, getSource, function (errHits, categories) {
            if (errHits) {
              logger.warn('Unable to get results: ', errHits);
              return callback(new ServiceUnavailableError('Unable to create festival event'));
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

  var getFestivalCategory = function getFestivalCategory(festivalId, categoryId, callback) {
    logger.args('getFestivalCategory: ', arguments);

    es.get(categoryId, config.elasticsearch.categories,
      function (error, result) {

        if (error) {
          logger.warn('Unable to get festival category', error);
          return callback(new ServiceUnavailableError('Unable to get festival category'));
        }

        return callback(null, result);
      });
  };

  var deleteFestivalCategory = function deleteFestivalCategory(festivalId, categoryId, callback) {
    logger.args('deleteFestivalCategory: ', arguments);

    es.remove(categoryId, config.elasticsearch.categories,
      function (error, result) {

        if (error) {
          logger.warn('Unable to delete festival category', error);
          return callback(new ServiceUnavailableError('Unable to delete festival category'));
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
          return callback(new ServiceUnavailableError('Unable to update festival news'));
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
              return callback(new ServiceUnavailableError('Unable to create festival event'));
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
          logger.warn('Unable to delete festival news', error);
          return callback(new ServiceUnavailableError('Unable to delete news'));
        }

        return callback(null, result);
      });
  };

  return {
    createFestival: createFestival,
    updateFestival: updateFestival,
    getFestivals: getFestivals,
    getFestival: getFestival,
    deleteFestival: deleteFestival,
    createFestivalEvent: createFestivalEvent,
    updateFestivalEvent: updateFestivalEvent,
    getFestivalEvents: getFestivalEvents,
    getFestivalEvent: getFestivalEvent,
    deleteFestivalEvent: deleteFestivalEvent,
    createFestivalPlace: createFestivalPlace,
    updateFestivalPlace: updateFestivalPlace,
    getFestivalPlaces: getFestivalPlaces,
    getFestivalPlace: getFestivalPlace,
    deleteFestivalPlace: deleteFestivalPlace,
    createFestivalCategory: createFestivalCategory,
    updateFestivalCategory: updateFestivalCategory,
    getFestivalCategories: getFestivalCategories,
    getFestivalCategory: getFestivalCategory,
    deleteFestivalCategory: deleteFestivalCategory,
    getNewsCollection: getNewsCollection,
    createNews: createNews,
    getNews: getNews,
    updateNews: updateNews,
    deleteNews: deleteNews
  };
};

module.exports = {
  provider: provider
};
