'use strict';

var logger = require('../logger/logger').logger;

module.exports.es = function es(client) {

  var exists = function exists(id, esConfig, callback) {
    logger.debug('exists in elastic search: ', id);

    client.exists({
      index: esConfig.index,
      type: esConfig.type,
      id: id
    }, function (err, response) {
      logger.debug('es exists response: ', err, response);
      return callback(err, response);
    });
  };

  var create = function create(id, body, esConfig, callback) {
    logger.debug('create in elastic search: ', id);

    client.create({
      index: esConfig.index,
      type: esConfig.type,
      id: id,
      body: body
    }, function (err, response) {
      logger.debug('es create response: ', err, response);
      return callback(err, response);
    });
  };

  var update = function update(id, body, esConfig, callback) {
    logger.debug('update in elastic search: ', id);

    client.update({
      index: esConfig.index,
      type: esConfig.type,
      id: id,
      body: {doc: body}
    }, function (err, response) {
      logger.debug('es update response: ', err, response);
      return callback(err, response);
    });
  };

  var get = function get(id, esConfig, callback) {
    logger.debug('get data from elastic search: ', id);

    client.getSource({
      index: esConfig.index,
      type: esConfig.type,
      id: id
    }, function (err, response) {
      logger.debug('es get: ', err, response);
      return callback(err, response);
    });
  };

  var remove = function remove(id, esConfig, callback) {
    logger.debug('remove data from elastic search: ', id);

    client.delete({
      index: esConfig.index,
      type: esConfig.type,
      id: id
    }, function (err, response) {
      logger.debug('es delete: ', err, response);
      return callback(err, response);
    });
  };

  var save = function save(id, body, callback) {
    logger.debug('save data to elastic search: ', id);

    exists(id, function (err, found) {

      if (err) {
        return callback(err);
      }

      if (found) {
        return update(id, body, callback);
      }

      return create(id, body, callback);
    });
  };

  var search = function search(body, esConfig, callback) {
    logger.debug('search data to elastic search: ', body);

    client.search({
      index: esConfig.index,
      type: esConfig.type,
      body: body
    }, function (error, response) {
      logger.debug('es search: ', error, response);
      return callback(error, response);
    });
  };

  return {
    exists: exists,
    create: create,
    update: update,
    get: get,
    remove: remove,
    save: save,
    search: search
  };
};
