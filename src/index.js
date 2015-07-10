'use strict'

var express = require('express');
var http = require('http');
var configRedis = require('./config/redis');
var redis = require('./redis/redis-lib');
var getJSONAsync = require('./getJSONAsync');
var neo4jAsync = require('./neo4j/neo4jAsync');
var Promise = require('bluebird');
var bodyParser = require('body-parser');
var async = require('async');
var _ = require('lodash');

//var fs = Promise.promisifyAll(require('fs'));
var fs = require('fs');

// Constants
var PORT = 4343;

// App
var app = express();

// parse application/json
app.use(bodyParser.json());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));


redis.config(configRedis, app);


app.get('/', function (req, res) {
  res.send('Hello world\n');
});

//Should be a service for his own ! 
// Complexity of the call is o(n2)
// loop of (number_follower * nbr_post);
// Shloud be enough for the moment
app.post('/api/delete_feed_of_startup_follower', function (req, res){

	if(req.body.stp_tag){
		var stp_tag = req.body.stp_tag;
		var redisClient = req.app.get('redisClient');

		async.parallel({
			get_posts: function(callback){
				redisClient.zrangeAsync('Startup:'+stp_tag+':MailboxPost', 0, -1)
				.then(function(list){
					console.log(list);

					//get all data and shrink the timestamp

					callback(null, list);
				})
				.catch(function(err){
					
					callback(err, null);
				})
			},
			get_followers: function(callback){
				neo4jAsync.cypherQuery("MATCH (s:Startup {name:'"+stp_tag+"'})<-[f:FOLLOW]-(u:User) RETURN u.name")
				.then(function(user){
					console.log(user);
					callback(null, user.data);
				})
				.catch(function(err){
					callback(err, null);
				})
			}
		}, function(err, result){
			if(err){
				res.setHeader('Content-Type', 'text/json');
				res.status(500).send(err);
			} else {

				var followers = result.get_followers;
				var posts = result.get_posts;
				//Shloud be enough for the moment
				//Potential large amount of concurrency call to redis -> nbr_follower !
				async.map(followers, function(follower_username, callback){

					var multi = redisClient.multi();

					for(var i=0; i<posts.length; i++){
						multi.zrem('Users:'+follower_username+':MailboxFeed', posts[i]);
					}

				    // multi chain to rem every post from user feed !
				    multi
			        .exec(function (err, replies) {
			        	if(err){
			        		console.log(err);
			        		callback(err, null);
			        	} else {
			        		callback(null, true);
			        	}
			        });
				},
				function(err, results){
					if(err){
						res.setHeader('Content-Type', 'text/json');
						res.status(500).send(err);
					} else {
						res.setHeader('Content-Type', 'text/json');
						res.status(200).send({result:true});


						//Async call for deleting the valley and world 
						neo4jAsync.cypherQuery("MATCH (s:Startup {name:'"+stp_tag+"'})-[r1:IS_LOCATED_IN]->(Location)-[r2:IS_IN]->(v:Valley) RETURN v.name")
						.then(function(respQ){

							var valley_alias = respQ.data[0];
							var multiValley = redisClient.multi();
							var multiHotter = redisClient.multi();
							console.log(valley_alias);

							for(var i=0; i< posts.length; i++){
					
								multiValley.lrem('Valley:'+valley_alias+':MailboxFeed', -1, posts[i]);
								multiHotter.lrem('Hottest:MailboxFeed',-1, posts[i]);
							}

							//Awful function i agree but it's just made to ensure series call
						    // multi chain to rem every post from Valley feed !
						    multiValley
					        .exec(function (err, replies) {
					        	if(err){
					        		console.log(err);
					        	} else {
					        		console.log('ok valley');
					        	}
					        });

					        //multi chain to rem every post from Hotter feed !
						    multiHotter
					        .exec(function (err, replies) {
					        	if(err){
					        		console.log(err);
					        	} else {
					        		console.log('ok world');
					        	}
					        });
						})
						.catch(function(err){
							console.log(err);
						})
					}
				});
			}	
		})
	} else {
		res.setHeader('Content-Type', 'text/json');
		res.status(400).send('Bad request');
	}
});

app.post('/api/delete_feed_of_organization_follower', function (req, res){

	if(req.body.org_tag){
		var org_tag = req.body.org_tag;
		var redisClient = req.app.get('redisClient');

		async.parallel({
			get_posts: function(callback){
				redisClient.zrangeAsync('Organization:'+org_tag+':MailboxPost', 0, -1)
				.then(function(list){
					console.log(list);

					//get all data and shrink the timestamp

					callback(null, list);
				})
				.catch(function(err){
					
					callback(err, null);
				})
			},
			get_followers: function(callback){
				neo4jAsync.cypherQuery("MATCH (o:Organization {name:'"+org_tag+"'})<-[f:FOLLOW]-(u:User) RETURN u.name")
				.then(function(user){
					console.log(user);
					callback(null, user.data);
				})
				.catch(function(err){
					callback(err, null);
				})
			}
		}, function(err, result){
			if(err){
				res.setHeader('Content-Type', 'text/json');
				res.status(500).send(err);
			} else {

				var followers = result.get_followers;
				var posts = result.get_posts;
				//Shloud be enough for the moment
				//Potential large amount of concurrency call to redis -> nbr_follower !
				async.map(followers, function(follower_username, callback){

					var multi = redisClient.multi();

					for(var i=0; i<posts.length; i++){
						multi.zrem('Users:'+follower_username+':MailboxFeed', posts[i]);
					}

				    // multi chain to rem every post from user feed !
				    multi
			        .exec(function (err, replies) {
			        	if(err){
			        		console.log(err);
			        		callback(err, null);
			        	} else {
			        		callback(null, true);
			        	}
			        });
				},
				function(err, results){
					if(err){
						res.setHeader('Content-Type', 'text/json');
						res.status(500).send(err);
					} else {
						res.setHeader('Content-Type', 'text/json');
						res.status(200).send({result:true});


						//Async call for deleting the valley and world 
						neo4jAsync.cypherQuery("MATCH (o:Organization {name:'"+org_tag+"'})-[r1:IS_LOCATED_IN]->(Location)-[r2:IS_IN]->(v:Valley) RETURN v.name")
						.then(function(respQ){

							var valley_alias = respQ.data[0];
							var multiValley = redisClient.multi();
							var multiEvent = redisClient.multi();

							console.log(valley_alias);

							for(var i=0; i< posts.length; i++){
								multiValley.lrem('Valley:'+valley_alias+':MailboxFeed', -1, posts[i]);
								multiEvent.zrem('Valley:'+valley_alias+':EventList', posts[i]);
							}

							//Awful function i agree but it's just made to ensure series call
						    // multi chain to rem every post from Valley feed !
						    multiValley
					        .exec(function (err, replies) {
					        	if(err){
					        		console.log(err);
					        	} else {
					        		console.log('ok valley');
					        	}
					        });

					        //Awful function i agree but it's just made to ensure series call
						    // multi chain to rem every post from Valley feed !
						    multiEvent
					        .exec(function (err, replies) {
					        	if(err){
					        		console.log(err);
					        	} else {
					        		console.log('ok valley');
					        	}
					        });
						})
						.catch(function(err){
							console.log(err);
						})
					}
				});
			}	
		})
	} else {
		res.setHeader('Content-Type', 'text/json');
		res.status(400).send('Bad request');
	}
})

//Propagate the post into Mailbox feed of followers.
app.post('/api/transfer-feed-to-followers', function (req, res){

	if(req.body.post_id && req.body.timestamp){
		console.log('ALLLEZ SA MAMANNNN')
		var entity_graph_id = req.body.stp_graph_id || req.body.org_graph_id;
		
		var post_id = req.body.post_id;
		var timestamp = req.body.timestamp;

		var redisClient = req.app.get('redisClient');

		console.log(entity_graph_id);
		console.log(post_id);

		neo4jAsync.readRelationshipsOfNode(entity_graph_id, {
			    types: ['FOLLOW'],  // optional
			    direction: 'in' // optional, alternative 'out', defaults to 'all'
		})
		.then(function(result){

			var followers = _.pluck(result, '_start');

			async.map(followers, function(follower_id, callback){

				neo4jAsync.readNode(follower_id)
				.then(function(fol){
					console.log(fol)
					console.log('1');
					callback(null,fol);
				})
				.catch(function(err){
					console.log(err);
					//Log the error but should not be a reason to consider all operation on failure.
					console.log('ERROR1');
					callback(null);
				})
			},
			function(err, results){

				//If one or more errors, just log it with explicit content. 
				if(err){
					console.log(err);
				}
				console.log('2');
				var followers_username = _.pluck(results, 'name');
				console.log(followers_username);
				async.map(followers_username, function(follower_usnm, callback2){
					console.log('Users:'+follower_usnm+':MailboxFeed');
					
					return redisClient.zaddAsync('Users:'+follower_usnm+':MailboxFeed', timestamp, post_id)
					.then(function(code){
						callback2(null,code);
					})
					.catch(function(err){
						callback2(null,null);
					})						
				},
				function(err, results){
					if(err){
						//log that
						console.log(err);
					}
					//We won't wait for the task to be completed. Only logging for success/failure.
					res.setHeader('Content-Type', 'text/json');
					res.status(200).send('{"job":"pending"}');
				});
			});
		})
		.catch(function(err){

			console.log(err);
			res.setHeader('Content-Type', 'text/json');
			res.status(500).send('{"job":"error"}');
		});
	} else {
		
		res.status(400).send();
	}	
});

/*
* Startup follow action
*/
app.post('/api/startup/newly-follower-feed', function (req, res){

	if(req.body.stp_tag && req.body.username){
		var stp_tag = req.body.stp_tag;
		var username = req.body.username;
		var redisClient = req.app.get('redisClient');

		//Max 15 historic of the startup in the feed. Useless to go further considering the fact that users don't scrolling down through many days back
		redisClient.zrevrangeAsync('Startup:'+stp_tag+':MailboxPost', 0, 14, 'WITHSCORES')
		.then(function(list){
			console.log(list);

			//Blocking if lots of post to follow retroactively.
			var j = 0;
			var posts_id_value = _.filter(list, function(n) {
				var isEven = j % 2 == 0;
				j++;
			  	return isEven;
			});

			var values = {data:[]};
			for(var i = 0; i<posts_id_value.length; i++){
				values.data.push({value:posts_id_value[i]})
			}

			
			var k = 0;
			var posts_id_score = _.filter(list, function(n) {
				var isOdd = Math.abs(k) % 2 == 1;
				console.log(isOdd);
				k++;
			  	return isOdd;
			});

			var keys = {data:[]};
			for(var i = 0; i<posts_id_score.length; i++){
				keys.data.push({key:posts_id_score[i]})
			}

			var merged = _.merge(values, keys);
			//console.log(merged);{}
			async.map(merged.data, function(data, callback2){

				return redisClient.zaddAsync('Users:'+username+':MailboxFeed', data.key, data.value)
				.then(function(code){
					console.log('ok cest ok');
					callback2(null,code);
				})
				.catch(function(err){
					console.log('merde shit');
					callback2(null,null);
				});
			},
			function(err, results){
				res.setHeader('Content-Type', 'text/json');
				res.status(200).send('{"job":"pending"}');
			})
		})
		.catch(function(err){
			//Log that
			console.log(err);
			res.setHeader('Content-Type', 'text/json');
			res.status(500).send('error');
		});

	} else {
		res.status(400).send();
	}
});

/*
* Startup unfollow action
*/
app.post('/api/startup/newly-unfollower-feed', function (req, res){

	if(req.body.stp_tag && req.body.username){
		var stp_tag = req.body.stp_tag;
		var username = req.body.username;
		var redisClient = req.app.get('redisClient');

		redisClient.zrangeAsync('Startup:'+stp_tag+':MailboxPost', 0, -1)
		.then(function(list){
			//console.log(list);
			async.map(list, function(data, callback2){
				return redisClient.zremAsync('Users:'+username+':MailboxFeed', data)
				.then(function(code){
					callback2(null,code);
				})
				.catch(function(err){
					callback2(null,null);
				});
			},
			function(err, results){
				res.setHeader('Content-Type', 'text/json');
				res.status(200).send('{"job":"pending"}');
			})
		})
		.catch(function(err){
			//Log that
			console.log(err);
			res.setHeader('Content-Type', 'text/json');
			res.status(500).send('error');
		});
	} else {
		res.status(400).send();
	}
});


/*
* Organization follow action
*/
app.post('/api/organization/newly-follower-feed', function (req, res){

	if(req.body.org_tag && req.body.username){
		var org_tag = req.body.org_tag;
		var username = req.body.username;
		var redisClient = req.app.get('redisClient');

		redisClient.zrangeAsync('Organization:'+org_tag+':MailboxPost', 0, -1, 'WITHSCORES')
		.then(function(list){
			console.log(list);
			//Blocking if lots of post to follow retroactively.
			var j = 0;
			var posts_id_value = _.filter(list, function(n) {
				var isEven = j % 2 == 0;
				j++;
			  	return isEven;
			});

			var values = {data:[]};
			for(var i = 0; i<posts_id_value.length; i++){
				values.data.push({value:posts_id_value[i]})
			}

			var k = 0;
			var posts_id_score = _.filter(list, function(n) {
				var isOdd = Math.abs(k) % 2 == 1;
				console.log(isOdd);
				k++;
			  	return isOdd;
			});

			var keys = {data:[]};
			for(var i = 0; i<posts_id_score.length; i++){
				keys.data.push({key:posts_id_score[i]})
			}

			var merged = _.merge(values, keys);
			//console.log(merged);{}
			async.map(merged.data, function(data, callback2){

				return redisClient.zaddAsync('Users:'+username+':MailboxFeed', data.key, data.value)
				.then(function(code){
					console.log('ok cest ok');
					callback2(null,code);
				})
				.catch(function(err){
					console.log('merde shit');
					callback2(null,null);
				});
			},
			function(err, results){
				res.setHeader('Content-Type', 'text/json');
				res.status(200).send('{"job":"pending"}');
			})
		})
		.catch(function(err){
			//Log that
			console.log(err);
			res.setHeader('Content-Type', 'text/json');
			res.status(500).send('error');
		});

	} else {
		res.status(400).send();
	}
});

/*
* Organization unfollow action
*/
app.post('/api/organization/newly-unfollower-feed', function (req, res){

	if(req.body.org_tag && req.body.username){
		var org_tag = req.body.org_tag;
		var username = req.body.username;
		var redisClient = req.app.get('redisClient');

		redisClient.zrangeAsync('Organization:'+org_tag+':MailboxPost', 0, -1)
		.then(function(list){
			//console.log(list);
			async.map(list, function(data, callback2){
				return redisClient.zremAsync('Users:'+username+':MailboxFeed', data)
				.then(function(code){
					callback2(null,code);
				})
				.catch(function(err){
					callback2(null,null);
				});
			},
			function(err, results){
				res.setHeader('Content-Type', 'text/json');
				res.status(200).send('{"job":"pending"}');
			})
		})
		.catch(function(err){
			//Log that
			console.log(err);
			res.setHeader('Content-Type', 'text/json');
			res.status(500).send('error');
		});
	} else {
		res.status(400).send();
	}
});

if (fs.existsSync('./src/certificate/keynodetestservice.pem')) {
    var privateKey  = fs.readFileSync('./src/certificate/keynodetestservice.pem', 'utf8');
	var certificate = fs.readFileSync('./src/certificate/nodetestservice.pem', 'utf8');

	var credentials = {key: privateKey, cert: certificate};
	var httpsServer = require('https').createServer(credentials, app);

	httpsServer.listen(PORT, function(){
		console.log('Running on EC2 on instance :' + PORT);
	});

} else {

	http.createServer(app).listen(8080, function(){
	  console.log('Express server listening on port ' + 8080);
	});
}



