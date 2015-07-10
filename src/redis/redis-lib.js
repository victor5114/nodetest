/**
 * A custom library to establish a database connection
 */
'use strict';
var Promise = require('bluebird');
var redis = require('redis');
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

var dbRedis = function () {
    return {

        /**
         * Open a connection to the database
         * @param conf
         */
        config: function (conf, app) {  

            var client = redis.createClient(conf.port, conf.host);
            
            client.on('error', console.error.bind(console, 'connection error:'));

            client.on('connect', function() {
                console.log('connected to Redis');
                app.set('redisClient', client);
            });
        }
    };
};

module.exports = dbRedis();