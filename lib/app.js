'use strict';

var fs = require('fs');
var myRestifyApi = require('my-restify-api');
var ForbiddenError = myRestifyApi.error.ForbiddenError;
var oauth = myRestifyApi.plugin.oauth;

var clipboardsController = require('./controller/clipboards');
var pictogramsController = require('./controller/pictograms');

var logger = require('./logger/logger').logger;
var keen = require('./keen');
//var clipboards = require('./clipboards');

var clipboardsModel = require('xclipboard-model');
var ClipboardNotFoundError = clipboardsModel.error.ClipboardNotFoundError;

var startServer = function startServer(callback) {
  fs.readFile('config/public.key', function (err, data) {
    if (err) {
      logger.debug('config/public.key read error: ', err);
      throw err;
    }

    var options = {
      appName: 'clipboards',
      swagger: {
        enabled: true,
        apiDocsDir: __dirname + '/../public/'
      },
      authorization: {
        authHeaderPrefix: 'x-auth-',
        key: data,
        noVerify: false
      },
      bodyParser: {
        enabled: true,
        options: {
          maxBodySize: 1e6,
          mapParams: true,
          overrideParams: false
        }
      },
      acceptable: [
        'application/vnd.clipboards.v1+json',
        'application/vnd.clipboards.v1+xml'
      ]
    };

    var errorHandlers = {
      ClipboardNotFound: {
        className: 'NotFoundError'
      },
      ServiceUnavailable: {
        className: 'ServiceUnavailableError'
      },
      '': {
        className: 'ServiceUnavailableError'
      }
    };

    var publicCacheHandler = function publicCacheHandler(req, res, next) {
      res.cache('public', {maxAge: 3600});
      res.header('Vary', 'Accept-Language, Accept-Encoding, Accept, Content-Type');
      res.charSet('utf-8');
//    res.header('Last-Modified', new Date());
      return next();
    };

    var noCacheHandler = function noCacheHandler(req, res, next) {
      res.cache('private');
      res.charSet('utf-8');
      return next();
    };

    var noPreconditionHandler = function noPreconditionHandler(req, res, next) {
      return next();
    };

    var routes = {
      get: [],
      post: [],
      put: [],
      del: []
    };

    routes.get.push({
      options: {
        path: '/api/clipboards', version: '1.0.0'
      },
      authMethod: function readClipboardsAuthHandler(req, res, next) {

        //return oauth(req, next)
        //  .scope('clipboards:get', 'Brak uprawnień do pobierania clipboards')
        //  .user()
        //  .next();
        next();
      },
      cache: publicCacheHandler,
      precondition: noPreconditionHandler,
      controllerMethod: clipboardsController.getClipboardsV1
    });

    routes.post.push({
      options: {
        path: '/api/clipboards', version: '1.0.0'
      },
      authMethod: function createClipboardsAuthHandler(req, res, next) {
        //
        //return oauth(req, next)
        //  .scope('clipboards:create', 'Brak uprawnień do tworzenia clipboards')
        //  .user()
        //  .next();
        next();
      },
      cache: noCacheHandler,
      precondition: noPreconditionHandler,
      controllerMethod: clipboardsController.createClipboardV1
    });

    routes.get.push({
      options: {
        path: '/api/clipboards/:id', version: '1.0.0'
      },
      authMethod: function readClipboardsAuthHandler(req, res, next) {

        //return oauth(req, next)
        //  .scope('clipboards:get', 'Brak uprawnień do pobierania clipboards')
        //  .user()
        //  .next();
        next();
      },
      cache: publicCacheHandler,
      precondition: noPreconditionHandler,
      controllerMethod: clipboardsController.getClipboardV1
    });

    routes.del.push({
      options: {
        path: '/api/clipboards/:id', version: '1.0.0'
      },
      authMethod: function deleteClipboardsAuthHandler(req, res, next) {
        //
        //return oauth(req, next)
        //  .scope('clipboards:delete', 'Brak uprawnień do usuwania clipboards')
        //  .user()
        //  .next();
        next();
      },
      cache: noCacheHandler,
      precondition: noPreconditionHandler,
      controllerMethod: clipboardsController.deleteClipboardV1
    });

    routes.get.push({
      options: {
        path: '/api/pictograms', version: '1.0.0'
      },
      authMethod: function readPictogramsAuthHandler(req, res, next) {
        //
        //return oauth(req, next)
        //  .scope('pictograms:get', 'Brak uprawnień do pobierania pictograms')
        //  .user()
        //  .next();
        next();
      },
      cache: publicCacheHandler,
      precondition: noPreconditionHandler,
      controllerMethod: pictogramsController.getPictogramsV1
    });

    var server = myRestifyApi.createServer(routes, errorHandlers, options);

    server.opts(/.*/, function (req, res, next) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', req.header('Access-Control-Request-Method'));
      res.header('Access-Control-Allow-Headers', req.header('Access-Control-Request-Headers'));
      res.send(200);
      return next();
    });

    myRestifyApi.runServer(server, options, function (errServer, port) {
      logger.debug('myRestifyApi running on port: %d', port);
      return callback(errServer, port);
    });
  });
};

module.exports = {
  startServer: startServer
};
