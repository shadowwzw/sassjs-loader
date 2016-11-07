'use strict';

var sassJs = require('sass.js'),
    q = require('q'),
    qFs = require('q-io/fs'),
    path = require('path'),
    _ = require('lodash');

module.exports = function(content) {
    var callback = this.async();

    sassJs.importer(function(request, done) {
        // Adapted from
        // eslint-disable-next-line max-len 
        // https://github.com/amiramw/grunt-contrib-sassjs/blob/a65f869df967a4e417c4260fd93239e4f0bc55ee/tasks/sass.js#L11
		if (request.path) {
			done();
		} else if (request.resolved) {
			var pathVariations = sassJs.getPathVariations(request.current);

            q.all(_.map(pathVariations, function(pathVariation) {
                var resolvedDir = path.dirname(request.resolved), 
                    fullPath = path.join(resolvedDir, pathVariation);
                    
                return qFs.read(fullPath)
                    .then(function(fileContents) {
                        return {
                            path: fullPath,
                            content: fileContents
                        };
                    })
                    .catch(function(err) {
                        if (err.code === 'ENOENT') {
                            return null;
                        }
                        throw err;
                    });    
            })).then(function(files) {
                done(_(files).compact().first());
            });
		} else {
			done();
		}
    });

    sassJs.compile(content, {inputPath: this.resourcePath}, function(result) {
        if (!result.status) {
            callback(null, result.text);
        } else {
            callback(result);
        }
    });
};
