'use strict';

var options = require('config');
var logger = require('../logger/logger').logger;
var assert = require('assert-plus');
var myRestifyApi = require('my-restify-api');
var BadRequestError = myRestifyApi.error.BadRequestError;

var clipboards = require('../clipboards');
var keen = require('../keen');

var clipboardsModel = require('xclipboard-model');

var PictogramsCollectionResponseBuilder = clipboardsModel.model.pictogramsCollectionResponse.PictogramsCollectionResponseBuilder;
var PictogramResponseBuilder = clipboardsModel.model.pictogramResponse.PictogramResponseBuilder;

var getPictogramsV1 = function getPictogramsV1(req, res, next) {

  try {
    assert.optionalString(req.params.category, 'category');
  }
  catch (e) {
    logger.warn(e);
    return next(new BadRequestError(e.message));
  }

  var category = req.params.category;

  clipboards.getPictograms({category: category, limit: 10000}, options, function (err, data) {

    if (err) {
      keen.errorPictogram('search', req.authorization.bearer, req.params, err);
    }

    next.ifError(err);

    var collection = data.pictograms.map(function (item) {
      return new PictogramResponseBuilder()
        .withId(item.id)
        .withCategory(item.category)
        .withUrl(item.url)
        .build();
    });

    var response = new PictogramsCollectionResponseBuilder()
      .withTotal(data.total)
      .withPictograms(collection)
      .build();

    res.send(200, response);
    next();

    return keen.pictogramsSearch(req.authorization.bearer, req.params);
  });
};


module.exports = {
  getPictogramsV1: getPictogramsV1
};