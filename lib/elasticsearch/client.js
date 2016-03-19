'use strict';

var logger = require('../logger/logger').logger;
var config = require('config');
var elasticsearchClient = require('elasticsearch').Client;
var extend = require('util')._extend;

var connection = null;

var updateMappings = function updateMappings(index, type, mapping, callback) {

  connection.indices.delete({
      index: index,
      type: type
    },
    function (errorDelete, responseDelete) {
      console.log('es: deleteMapping: ', errorDelete, responseDelete);

      connection.indices.create({
          index: index,
          type: type
        },
        function (errorCreate, responseCreate) {
          console.log('es: create: ', errorCreate, responseCreate);

          connection.indices.putMapping({
              index: index,
              type: type,
              body: mapping
            },
            function (errorPut, responsePut) {
              console.log('es: indices putMapping: ', errorPut, responsePut);

              connection.indices.getMapping({
                  index: index,
                  type: type
                },
                function (error, response) {
                  console.log('es: indices getMapping: ', error, response);
                  return callback(error, response);
                }
              );

            }
          );
        });
    });
};

var init = function init() {

  var es = config.provider.get('elasticsearch');
  var esConfig = extend(es, {'__reused': false});
  esConfig.log = {
    type: 'stdio',
    level: logger.level
    //level: 'trace'
  };

  connection = new elasticsearchClient(esConfig);

  if (false) {
    updateMappings(
      config.elasticsearch.clipboards.index,
      config.elasticsearch.clipboards.type,
      config.elasticsearch.clipboards.mappings,
      function (/*err, res*/) {
        //
        //updateMappings(
        //  config.elasticsearch.festivals.index,
        //  config.elasticsearch.festivals.type,
        //  config.elasticsearch.festivals.mappings,
        //  function (/*err, res*/) {

      });
  }

  //connection.indices.create({
  //    index: config.elasticsearch.index
  //  },
  //  function (error, response) {
  //    console.log('es: indices create: ', error, response);
  //  }
  //);

  //
  //connection.indices.getMapping({
  //    index: config.elasticsearch.index,
  //    type: config.elasticsearch.festivals.type
  //  },
  //  function (error, response) {
  //    console.log('es: indices putMapping: ', error, response);
  //  }
  //);
};

var connect = function connect() {
  if (!connection) {
    init();
  }

  return connection;
};

module.exports = {
  connect: connect
};

