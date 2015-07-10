/**
 * A custom library to establish a database connection
 */
'use strict';

var neo4j = require('node-neo4j');
var configNeo4j = require('../config/neo4j');

var dbNeo4j = function () {
    return {

        /**
         * Open a connection to the database
         * @param conf
         */
        initialize: function () {  

            var db = new neo4j('http://'+configNeo4j.username+':'+configNeo4j.password+'@'+configNeo4j.host+':'+configNeo4j.port);
            console.log('http://'+configNeo4j.username+':'+configNeo4j.password+'@'+configNeo4j.host+':'+configNeo4j.port);
            console.log('connected to Neo4j');
            return db;
        }
    };
};

module.exports = dbNeo4j();