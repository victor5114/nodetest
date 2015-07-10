'use strict';

var Promise = require('bluebird');
//Import neo4J client
var dbNeo4j = require('./neo4j-lib');
var neo4jClient = dbNeo4j.initialize();

exports.insertNode = function(data){

	return new Promise(function(resolve, reject) {
	    //Add new Node in graph
	    neo4jClient.insertNode(data, function (err, node){
	        if(err){
	            reject(err);
	        } else {
	        	console.log('0('+node.name+') : inserted');
	            resolve(node);
	        }
	    });
	});
};


exports.readNode = function(node_id){

	return new Promise(function(resolve, reject) {
	    //Add new Node in graph
	    neo4jClient.readNode(node_id, function (err, node){
	        if(err){
	            reject(err);
	        } else {
	            resolve(node);
	        }
	    });
	});
};

exports.addLabelToNode = function(node, LabelName){

	return new Promise(function(resolve, reject){
		//Add Label to node
		neo4jClient.addLabelsToNode(node._id, LabelName, function (err, result) {
			if(err){
				reject(err);
			} else {
				console.log('0('+node+') : '+ LabelName+' added');
	            resolve(result);
			}
		});
	})
};

exports.insertRelationship = function(root, element, namelink, properties){
	return new Promise(function(resolve, reject){
		//Add Label to node
		neo4jClient.insertRelationship(root, element, namelink, properties, function (err, result) {
			if(err){
				reject(err);
			} else {
				console.log('relation create : 0('+element+')<-----'+namelink+'('+properties+')----0('+root+')');
	            resolve(result);
			}
		});
	})
};

//E.g of filter: {
//		    types: ['RELATED_TO', ...] // optional
//		    direction: 'in' // optional, alternative 'out', defaults to 'all'
//		    }
exports.readRelationshipsOfNode = function(node_id, filter){
	return new Promise(function(resolve, reject){
		neo4jClient.readRelationshipsOfNode(node_id, filter, function(err, relationships) {
		        if (err){
		        	reject(err);
		        } else {
		        	resolve(relationships);
		        }
		});
	});
};


exports.cypherQuery = function(query){
	return new Promise(function(resolve, reject){
		console.log('HELLO');
		neo4jClient.cypherQuery(query, function (err, result){
			if(err){
				reject(err);
			} else {
	            resolve(result);
			}
		});
	})
}