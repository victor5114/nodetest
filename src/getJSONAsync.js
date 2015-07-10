var exports = module.exports = {},
    http = require('http'),
    https = require('https')
    Promise = require('bluebird');

exports.getJSONAsync = function(options, onResult) {
    
    return new Promise(function(resolve, reject) {

        var prot = options.port == 443 ? https : http;
        var req = prot.request(options, function(res){
            if (res.statusCode == 200) {
                var output = '';
                console.log(options.host + ':' + res.statusCode);
                res.setEncoding('utf8');

                res.on('data', function (chunk) {
                    output += chunk;
                });

                res.on('end', function() {
                    var obj = JSON.parse(output);
                    resolve(obj);
                });
            } else {
                reject('FacebookAPI reject with status  code :' + res.statusCode )
            }
        });

        req.on('error', function(err) {
            reject('error: ' + err.message);
        });

        req.end();
    });
};