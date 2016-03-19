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

var createFestival = function createFestival(newFestival, options, callback) {
  logger.debug('createFestival: ', newFestival);

  try {
    provider.createFestival(newFestival, function (err, festival) {

      if (err) {
        logger.debug('Unable to create festival: ', festival, err);
        return callback(err);
      }

      return callback(null, festival);
    });
  }
  catch (e) {
    logger.warn('unable to create festival: ', e);
    return callback(e);
  }
};

var updateFestival = function updateFestival(festivalId, newFestival, options, callback) {
  logger.debug('updateFestival: ', festivalId, newFestival);

  try {
    provider.updateFestival(festivalId, newFestival, function (err, festival) {

      if (err) {
        logger.debug('Unable to update festival: ', newFestival, err);
        return callback(err);
      }

      return callback(null, festival);
    });
  }
  catch (e) {
    logger.warn('unable to update festival: ', e);
    return callback(e);
  }
};

var getFestival = function getFestival(id, options, callback) {
  logger.debug('getFestival: ', id);

  try {
    provider.getFestival(id, function (err, festival) {

      if (err) {
        logger.debug('Unable to get festival: ', err);
        return callback(err);
      }

      return callback(null, festival);
    });
  }
  catch (e) {
    logger.warn('unable to get festival for id: ', id, e);
    return callback(e);
  }
};

var deleteFestival = function deleteFestival(id, options, callback) {
  logger.debug('deleteFestival: ', id);

  try {
    provider.deleteFestival(id, function (err, festival) {

      if (err) {
        logger.debug('Unable to delete festival: ', err);
        return callback(err);
      }

      return callback(null, festival);
    });
  }
  catch (e) {
    logger.warn('unable to delete festival for id: ', id, e);
    return callback(e);
  }
};

var createFestivalEvent = function createFestivalEvent(festivalId, newEvent, options, callback) {
  logger.debug('createFestivalEvent: ', festivalId, newEvent);

  try {
    provider.createFestivalEvent(festivalId, newEvent, function (err, event) {

      if (err) {
        logger.debug('Unable to create festival event: ', festivalId, newEvent, err);
        return callback(err);
      }

      decorateEvent(event, function (errDecorate, result) {
        if (errDecorate) {
          logger.warn('Unable to decorate event: ', event, errDecorate);
          return callback(errDecorate);
        }

        return callback(null, result);
      });
    });
  }
  catch (e) {
    logger.warn('unable to create event: ', e);
    return callback(e);
  }
};

var updateFestivalEvent = function updateFestivalEvent(festivalId, eventId, newEvent, options, callback) {
  logger.debug('updateFestivalEvent: ', festivalId, eventId, newEvent);

  try {
    provider.updateFestivalEvent(festivalId, eventId, newEvent, function (err, event) {

      if (err) {
        logger.debug('updateFestivalEvent: Unable to update event: ', newEvent, err);
        return callback(err);
      }

      decorateEvent(event, function (errDecorate, result) {
        if (errDecorate) {
          logger.warn('Unable to decorate event: ', event, errDecorate);
          return callback(errDecorate);
        }

        return callback(null, result);
      });
    });
  }
  catch (e) {
    logger.warn('updateFestivalEvent: unable to update event: ', e);
    return callback(e);
  }
};

var getFestivalEvent = function getFestivalEvent(festivalId, eventId, options, callback) {
  logger.debug('getFestivalEvent: ', festivalId, eventId);

  try {
    provider.getFestivalEvent(festivalId, eventId, function (err, event) {

      if (err) {
        logger.warn('Unable to decorate event: ', event, err);
        return callback(err);
      }

      decorateEvent(event, function (errDecorate, result) {
        if (errDecorate) {
          logger.debug('Unable to decorate event: ', event, errDecorate);
          return callback(errDecorate);
        }

        return callback(null, result);
      });
    });
  }
  catch (e) {
    logger.warn('unable to get festival event for id: ', festivalId, eventId, e);
    return callback(e);
  }
};

var deleteFestivalEvent = function deleteFestivalEvent(festivalId, eventId, options, callback) {
  logger.debug('deleteFestivalEvent: ', festivalId, eventId);

  try {
    provider.deleteFestivalEvent(festivalId, eventId, function (err, event) {

      if (err) {
        logger.debug('Unable to delete event: ', err);
        return callback(err);
      }

      return callback(null, event);
    });
  }
  catch (e) {
    logger.warn('unable to delete event for id: ', festivalId, eventId, e);
    return callback(e);
  }
};

var getFestivalEvents = function getFestivalEvents(id, searchRequest, options, callback) {
  logger.debug('getFestivalEvents: ', id, searchRequest);

  try {
    provider.getFestivalEvents(id, searchRequest, function (err, data) {

      if (err) {
        logger.debug('Unable to get events: ', err);
        return callback(err);
      }

      async.map(data.events, decorateEvent, function (errDecorate, events) {

        if (errDecorate) {
          return callback(errDecorate);
        }

        data.events = events;
        return callback(null, data);
      });
    });
  }
  catch (e) {
    logger.warn('unable to get festival events for: ', id, searchRequest, e);
    return callback(e);
  }
};

var createFestivalPlace = function createFestivalPlace(festivalId, newPlace, options, callback) {
  logger.debug('createFestivalPlace: ', festivalId, newPlace);

  try {
    provider.createFestivalPlace(festivalId, newPlace, function (err, place) {

      if (err) {
        logger.debug('Unable to create place: ', festivalId, newPlace, err);
        return callback(err);
      }

      placeBreadcrumbs.updateBreadcrumbs(festivalId, place);

      return callback(null, place);
    });
  }
  catch (e) {
    logger.warn('unable to create festival: ', e);
    return callback(e);
  }
};

var updateFestivalPlace = function updateFestivalPlace(festivalId, placeId, newPlace, options, callback) {
  logger.debug('updateFestivalPlace: ', festivalId, placeId, newPlace);

  try {
    provider.updateFestivalPlace(festivalId, placeId, newPlace, function (err, place) {

      if (err) {
        logger.debug('Unable to update place: ', newPlace, err);
        return callback(err);
      }

      placeBreadcrumbs.updateBreadcrumbs(festivalId, place);

      return callback(null, place);
    });
  }
  catch (e) {
    logger.warn('unable to update place: ', e);
    return callback(e);
  }
};

var getFestivalPlace = function getFestivalPlace(festivalId, placeId, options, callback) {
  logger.debug('getFestivalPlace: ', festivalId, placeId);

  try {
    provider.getFestivalPlace(festivalId, placeId, function (err, place) {

      if (err) {
        logger.debug('Unable to get place: ', err);
        return callback(err);
      }

      return callback(null, place);
    });
  }
  catch (e) {
    logger.warn('unable to get place for id: ', festivalId, placeId, e);
    return callback(e);
  }
};

var deleteFestivalPlace = function deleteFestivalPlace(festivalId, placeId, options, callback) {
  logger.debug('deleteFestivalPlace: ', festivalId, placeId);

  try {
    provider.deleteFestivalPlace(festivalId, placeId, function (err, place) {

      if (err) {
        logger.debug('Unable to delete place: ', err);
        return callback(err);
      }

      return callback(null, place);
    });
  }
  catch (e) {
    logger.warn('unable to delete place for id: ', festivalId, placeId, e);
    return callback(e);
  }
};

var getFestivalPlaces = function getFestivalPlaces(id, searchRequest, options, callback) {
  logger.debug('getFestivalPlaces: ', id, searchRequest);

  try {
    provider.getFestivalPlaces(id, searchRequest, function (err, places) {

      if (err) {
        logger.debug('Unable to get places: ', err);
        return callback(err);
      }

      return callback(null, places);
    });
  }
  catch (e) {
    logger.warn('unable to get places for: ', id, searchRequest, e);
    return callback(e);
  }
};

var createFestivalCategory = function createFestivalCategory(festivalId, newCategory, options, callback) {
  logger.debug('createFestivalCategory: ', festivalId, newCategory);

  try {
    provider.createFestivalCategory(festivalId, newCategory, function (err, category) {

      if (err) {
        logger.debug('Unable to create category: ', festivalId, newCategory, err);
        return callback(err);
      }

      categoryBreadcrumbs.updateBreadcrumbs(festivalId, category);

      return callback(null, category);
    });
  }
  catch (e) {
    logger.warn('unable to create category: ', e);
    return callback(e);
  }
};

var updateFestivalCategory = function updateFestivalCategory(festivalId, categoryId, newCategory, options, callback) {
  logger.debug('updateFestivalCategory: ', festivalId, categoryId, newCategory);

  try {
    provider.updateFestivalCategory(festivalId, categoryId, newCategory, function (err, category) {

      if (err) {
        logger.debug('Unable to update category: ', newCategory, err);
        return callback(err);
      }

      categoryBreadcrumbs.updateBreadcrumbs(festivalId, category);

      return callback(null, category);
    });
  }
  catch (e) {
    logger.warn('unable to update category: ', e);
    return callback(e);
  }
};

var getFestivalCategory = function getFestivalCategory(festivalId, categoryId, options, callback) {
  logger.debug('getFestivalCategory: ', festivalId, categoryId);

  try {
    provider.getFestivalCategory(festivalId, categoryId, function (err, category) {

      if (err) {
        logger.debug('Unable to get category: ', err);
        return callback(err);
      }

      return callback(null, category);
    });
  }
  catch (e) {
    logger.warn('unable to get category for id: ', festivalId, categoryId, e);
    return callback(e);
  }
};

var deleteFestivalCategory = function deleteFestivalCategory(festivalId, categoryId, options, callback) {
  logger.debug('deleteFestivalCategory: ', festivalId, categoryId);

  try {
    provider.deleteFestivalCategory(festivalId, categoryId, function (err, category) {

      if (err) {
        logger.debug('Unable to delete category: ', err);
        return callback(err);
      }

      return callback(null, category);
    });
  }
  catch (e) {
    logger.warn('unable to delete category for id: ', festivalId, categoryId, e);
    return callback(e);
  }
};

var getFestivalCategories = function getFestivalCategories(id, searchRequest, options, callback) {
  logger.debug('getFestivalCategories: ', id, searchRequest);

  try {
    provider.getFestivalCategories(id, searchRequest, function (err, categories) {

      if (err) {
        logger.debug('Unable to get categories: ', err);
        return callback(err);
      }

      return callback(null, categories);
    });
  }
  catch (e) {
    logger.warn('unable to get categories for: ', id, searchRequest, e);
    return callback(e);
  }
};

var createNews = function createNews(newNews, options, callback) {
  logger.debug('createNews: ', newNews);

  try {
    provider.createNews(newNews, function (err, news) {

      if (err) {
        logger.debug('Unable to create news: ', newNews, err);
        return callback(err);
      }

      return callback(null, news);
    });
  }
  catch (e) {
    logger.warn('unable to create news: ', e);
    return callback(e);
  }
};

var updateNews = function updateNews(newsId, newNews, options, callback) {
  logger.debug('updateNews: ', newsId, newNews);

  try {
    provider.updateNews(newsId, newNews, function (err, news) {

      if (err) {
        logger.debug('Unable to update news: ', newNews, err);
        return callback(err);
      }

      return callback(null, news);
    });
  }
  catch (e) {
    logger.warn('unable to update news: ', e);
    return callback(e);
  }
};

var getNews = function getNews(newsId, options, callback) {
  logger.debug('getNews: ', newsId);

  try {
    provider.getNews(newsId, function (err, news) {

      if (err) {
        logger.debug('Unable to get news: ', err);
        return callback(err);
      }

      return callback(null, news);
    });
  }
  catch (e) {
    logger.warn('unable to get news for id: ', newsId, e);
    return callback(e);
  }
};

var deleteNews = function deleteNews(newsId, options, callback) {
  logger.debug('deleteNews: ', newsId);

  try {
    provider.deleteNews(newsId, function (err, news) {

      if (err) {
        logger.debug('Unable to delete news: ', err);
        return callback(err);
      }

      return callback(null, news);
    });
  }
  catch (e) {
    logger.warn('unable to delete news for id: ', newsId, e);
    return callback(e);
  }
};

var getNewsCollection = function getNewsCollection(searchRequest, options, callback) {
  logger.debug('getNewsCollection: ', searchRequest);

  try {
    provider.getNewsCollection(searchRequest, function (err, newsCollection) {

      if (err) {
        logger.debug('Unable to get news collection: ', err);
        return callback(err);
      }

      return callback(null, newsCollection);
    });
  }
  catch (e) {
    logger.warn('unable to get news collection for: ', searchRequest, e);
    return callback(e);
  }
};

module.exports = {
  VERSION: meta.VERSION,
  createFestival: createFestival,
  updateFestival: updateFestival,
  getFestival: getFestival,
  getPictograms: getPictograms,
  deleteFestival: deleteFestival,
  createFestivalEvent: createFestivalEvent,
  updateFestivalEvent: updateFestivalEvent,
  getFestivalEvent: getFestivalEvent,
  getFestivalEvents: getFestivalEvents,
  deleteFestivalEvent: deleteFestivalEvent,
  createFestivalPlace: createFestivalPlace,
  updateFestivalPlace: updateFestivalPlace,
  getFestivalPlace: getFestivalPlace,
  getFestivalPlaces: getFestivalPlaces,
  deleteFestivalPlace: deleteFestivalPlace,
  createFestivalCategory: createFestivalCategory,
  updateFestivalCategory: updateFestivalCategory,
  getFestivalCategory: getFestivalCategory,
  getFestivalCategories: getFestivalCategories,
  deleteFestivalCategory: deleteFestivalCategory,
  getNewsCollection: getNewsCollection,
  createNews: createNews,
  getNews: getNews,
  updateNews: updateNews,
  deleteNews: deleteNews
};
