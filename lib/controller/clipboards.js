'use strict';

var options = require('config');
var logger = require('../logger/logger').logger;
var assert = require('assert-plus');
var myRestifyApi = require('my-restify-api');
var BadRequestError = myRestifyApi.error.BadRequestError;
var ForbiddenError = myRestifyApi.error.ForbiddenError;

//var clipboards = require('../clipboards');
var keen = require('../keen');

var clipboardsModel = require('xclipboard-model');

var ClipboardsCollectionResponseBuilder = clipboardsModel.model.clipboardsCollectionResponse.ClipboardsCollectionResponseBuilder;
var ClipboardResponseBuilder = clipboardsModel.model.clipboardResponse.ClipboardResponseBuilder;
var SearchClipboardsRequestBuilder = clipboardsModel.model.searchClipboardsRequest.SearchClipboardsRequestBuilder;
var ClipboardNotFoundError = clipboardsModel.error.ClipboardNotFoundError;

var createClipboardV1 = function createClipboardV1(req, res, next) {
  var festival = null;

  try {
    assert.object(req.params, 'params');
    festival = festivalBuilders.buildFestivalDomain(req.params, true, req.authorization.bearer.userId);
  }
  catch (e) {
    logger.warn(e);
    return next(new BadRequestError(e.message));
  }

  clipboards.createFestival(festival, {}, function (err/*, result*/) {
    if (err) {
      keen.errorFestival('create', req.authorization.bearer, req.params, err);
    }
    next.ifError(err);

    res.send(201, festivalBuilders.buildFestivalResponse(festival));
    next();
    return cache.purge(req.authorization.credentials, '/api/clipboards');
  });
};

var getClipboardsV1 = function getClipboardsV1(req, res, next) {

  try {
    assert.optionalString(req.params.pictogram, 'pictogram');
  }
  catch (e) {
    logger.warn(e);
    return next(new BadRequestError(e.message));
  }

  var pictogram = req.params.pictogram;

  var searchClipboardsRequest = new SearchClipboardsRequestBuilder()
    .withPictogram(pictogram)
    .build();

  //clipboards.getClipboards(searchClipboardsRequest, options, function (err, data) {
  //
  //  if (err) {
  //    keen.errorClipboard('search', req.authorization.bearer, req.params, err);
  //  }
  //
  //  next.ifError(err);

  //var collection = data.clipboards
  //  .map(function (item) {
  //    return buildFestivalResponse(festival);
  //  });
  //
  var collection = [
    new ClipboardResponseBuilder()
      .withId('id')
      .withText('some text')
      .withPictogram('abcd')
      .withCreatedAt('createdAt')
      .build()
  ];

  var response = new ClipboardsCollectionResponseBuilder()
    .withTotal(collection.length)
    .withClipboards(collection)
    .build();

  res.send(200, response);
  next();

  return keen.clipboardsSearch(req.authorization.bearer, req.params);
  //});
};

var getClipboardV1 = function getClipboardV1(req, res, next) {

  try {
    assert.object(req.params, 'params');
    assert.string(req.params.id, 'id');
  }
  catch (e) {
    logger.warn(e);
    return next(new BadRequestError(e.message));
  }

  var id = req.params.id;

  clipboards.getFestival(id, options, function (err, festival) {
    if (err) {
      keen.errorFestival('get', req.authorization.bearer, req.params, err);
    }

    next.ifError(err);

    if (!festival) {
      return next(new ClipboardNotFoundError('Festival not found'));
    }

    res.send(200, festivalBuilders.buildFestivalResponse(festival));
    return next();
  });
};

var deleteClipboardV1 = function deleteClipboardV1(req, res, next) {

  try {
    assert.object(req.params, 'params');
    assert.string(req.params.id, 'id');
  }
  catch (e) {
    logger.warn(e);
    return next(new BadRequestError(e.message));
  }

  var id = req.params.id;

  clipboards.getFestival(id, options, function (err, festival) {
    next.ifError(err);

    if (!festival) {
      return next(new ClipboardNotFoundError('Festival not found'));
    }

    if (req.authorization.bearer.userId !== festival.userId) {
      return next(new ForbiddenError('Unable to update selected festival', 'Brak uprawnień do usunięcia wybranego festiwalu'));
    }

    clipboards.deleteFestival(id, options, function (errFestival/*, result*/) {
      if (errFestival) {
        keen.errorFestival('delete', req.authorization.bearer, req.params, errFestival);
      }

      next.ifError(errFestival);

      res.send(204, '');
      next();
      return cache.purge(req.authorization.credentials, '/api/clipboards');
    });
  });
};

module.exports = {
  createClipboardV1: createClipboardV1,
  getClipboardsV1: getClipboardsV1,
  getClipboardV1: getClipboardV1,
  deleteClipboardV1: deleteClipboardV1
};