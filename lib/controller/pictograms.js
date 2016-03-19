'use strict';

var options = require('config');
var logger = require('../logger/logger').logger;
var assert = require('assert-plus');
var myRestifyApi = require('my-restify-api');
var BadRequestError = myRestifyApi.error.BadRequestError;
var ForbiddenError = myRestifyApi.error.ForbiddenError;

var clipboards = require('../clipboards');
var keen = require('../keen');

var clipboardsModel = require('xclipboard-model');

var PictogramsCollectionResponseBuilder = clipboardsModel.model.pictogramsCollectionResponse.PictogramsCollectionResponseBuilder;
var PictogramResponseBuilder = clipboardsModel.model.pictogramResponse.PictogramResponseBuilder;
var FestivalNotFoundError = clipboardsModel.error.FestivalNotFoundError;

var getPictogramsV1 = function getPictogramsV1(req, res, next) {

  try {
    assert.optionalString(req.params.category, 'category');
  }
  catch (e) {
    logger.warn(e);
    return next(new BadRequestError(e.message));
  }

  var category = req.params.category;

  clipboards.getPictograms({category: category}, options, function (err, collection) {

    if (err) {
      keen.errorPictogram('search', req.authorization.bearer, req.params, err);
    }

    next.ifError(err);

    //var collection = [
    //  new PictogramResponseBuilder()
    //    .withId('abcd')
    //    .withCategory('flowers')
    //    .withUrl('http://xclipboard.github.io/flowers/1.png')
    //    .build()
    //];

    var response = new PictogramsCollectionResponseBuilder()
      .withTotal(collection.total)
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