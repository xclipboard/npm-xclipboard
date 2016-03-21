'use strict';

var uuid = require('node-uuid');
var moment = require('moment');
var options = require('config');
var logger = require('../logger/logger').logger;
var assert = require('assert-plus');
var myRestifyApi = require('my-restify-api');
var BadRequestError = myRestifyApi.error.BadRequestError;

var clipboards = require('../clipboards');
var keen = require('../keen');

var clipboardsModel = require('xclipboard-model');

var ClipboardsCollectionResponseBuilder = clipboardsModel.model.clipboardsCollectionResponse.ClipboardsCollectionResponseBuilder;
var ClipboardResponseBuilder = clipboardsModel.model.clipboardResponse.ClipboardResponseBuilder;
var SearchClipboardsRequestBuilder = clipboardsModel.model.searchClipboardsRequest.SearchClipboardsRequestBuilder;
var ClipboardNotFoundError = clipboardsModel.error.ClipboardNotFoundError;
var ClipboardPictogramAlreadyExistsError = clipboardsModel.error.ClipboardPictogramAlreadyExistsError;

var PICTOGRAM_SIZE = 4;

var validatePictogram = function validatePictogram(pictogram, callback) {

  if (pictogram.length < 3 * PICTOGRAM_SIZE) {
    return callback(new BadRequestError('Invalid pictogram length: too short', 'Wpisany pictogram jest za krótki', 'pictogram'));
  }

  if (pictogram.length > 10 * PICTOGRAM_SIZE) {
    return callback(new BadRequestError('Invalid pictogram length: too long', 'Wpisany pictogram jest za długi', 'pictogram'));
  }

  return clipboards.getPictograms({category: null, limit: 10000}, options, function (err, data) {

    if (err) {
      return callback(err);
    }

    var pictograms = data.pictograms.map(function (item) {
      return item.id;
    });

    var parts = pictogram.match(/[\s\S]{1,4}/g) || [];

    for (var i in parts) {
      if (parts.hasOwnProperty(i)) {
        if (pictograms.indexOf(parts[i]) < 0) {
          logger.info('invalid pictogram, can\'t find part \"%s\" of \"%s\" pictograms data', parts[i], pictogram);
          return callback(new BadRequestError('Invalid pictogram part: ' + parts[i] + ' of ' + pictogram, 'Wpisany pictogram jest niepoprawny', 'pictogram'));
        }
      }
    }

    return callback(null, true);
  });
};

var buildResponse = function buildResponse(item) {
  return new ClipboardResponseBuilder()
    .withId(item.id)
    .withText(item.text)
    .withPictogram(item.pictogram)
    .withCreatedAt(item.createdAt)
    .build();
};

var createClipboardV1 = function createClipboardV1(req, res, next) {
  try {
    assert.object(req.params, 'params');
    assert.string(req.params.text, 'text');
    assert.string(req.params.pictogram, 'pictogram');
  }
  catch (e) {
    logger.warn(e);
    return next(new BadRequestError(e.message));
  }

  var pictogram = req.params.pictogram;

  validatePictogram(pictogram, function (err/*, result*/) {

    if (err) {
      keen.errorClipboard('create', req.authorization.bearer, req.params, err);
    }

    next.ifError(err);

    var text = req.params.text;

    if (text.length > 500) {
      return next(new BadRequestError('Invalid text length: too long', 'Wpisany tekst jest za długi', 'text'));
    }

    var searchClipboardsByPictogramRequest = new SearchClipboardsRequestBuilder()
      .withPictogram(pictogram)
      .build();

    clipboards.getClipboards(searchClipboardsByPictogramRequest, options, function (errCollection, data) {
      if (errCollection) {
        keen.errorClipboard('create', req.authorization.bearer, req.params, errCollection);
      }
      next.ifError(errCollection);

      if (data.total > 0) {
        return next(new ClipboardPictogramAlreadyExistsError('Clipboard pictogram already exists: ' + pictogram));
      }

      var id = uuid.v4();

      var model = new ClipboardResponseBuilder()
        .withId(id)
        .withText(text)
        .withPictogram(pictogram)
        .withCreatedAt(moment().toISOString())
        .build();

      clipboards.createClipboard(model, {}, function (errCreate/*, result*/) {
        if (errCreate) {
          keen.errorClipboard('create', req.authorization.bearer, req.params, errCreate);
        }
        next.ifError(errCreate);

        res.send(201, model);
        next();
        return keen.clipboardsCreate(req.authorization.bearer, req.params);
      });
    });
  });
};

var getClipboardsV1 = function getClipboardsV1(req, res, next) {

  try {
    assert.string(req.params.pictogram, 'pictogram');
  }
  catch (e) {
    logger.warn(e);
    return next(new BadRequestError(e.message));
  }

  var pictogram = req.params.pictogram;

  var searchClipboardsRequest = new SearchClipboardsRequestBuilder()
    .withPictogram(pictogram)
    .build();

  clipboards.getClipboards(searchClipboardsRequest, options, function (err, data) {

    if (err) {
      keen.errorClipboard('search', req.authorization.bearer, req.params, err);
    }

    next.ifError(err);

    var collection = data.clipboards.map(buildResponse);

    var response = new ClipboardsCollectionResponseBuilder()
      .withTotal(data.total)
      .withClipboards(collection)
      .build();

    res.send(200, response);
    next();

    return keen.clipboardsSearch(req.authorization.bearer, req.params);
  });
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

  clipboards.getClipboard(id, options, function (err, clipboard) {
    if (err) {
      keen.errorClipboard('get', req.authorization.bearer, req.params, err);
    }

    next.ifError(err);

    if (!clipboard) {
      return next(new ClipboardNotFoundError('Clipboard not found'));
    }

    res.send(200, buildResponse(clipboard));
    next();

    return keen.getClipboard(req.authorization.bearer, req.params);
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

  clipboards.getClipboard(id, options, function (err, clipboard) {
    next.ifError(err);

    if (!clipboard) {
      return next(new ClipboardNotFoundError('Clipboard not found'));
    }

    //if (req.authorization.bearer.userId !== clipboard.userId) {
    //  return next(new ForbiddenError('Unable to update selected clipboard', 'Brak uprawnień do usunięcia wybranego festiwalu'));
    //}

    clipboards.deleteClipboard(id, options, function (errClipboard/*, result*/) {

      if (errClipboard) {
        keen.errorClipboard('delete', req.authorization.bearer, req.params, errClipboard);
      }

      next.ifError(errClipboard);

      res.send(204, '');
      next();

      return keen.deleteClipboard(req.authorization.bearer, req.params);
    });
  });
};

module.exports = {
  createClipboardV1: createClipboardV1,
  getClipboardsV1: getClipboardsV1,
  getClipboardV1: getClipboardV1,
  deleteClipboardV1: deleteClipboardV1
};