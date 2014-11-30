var fs = require('fs');
var path = require('path');
var util = require('util');
var exec = require('child_process').exec;
var args = process.argv.splice(2);

var q = require('q');

var jsonPath = path.join(__dirname, '../update.json');
var json = {};
var settings = {};

try {
    settings = require(path.join(__dirname, '../settings'));
} catch (e) {}

try {
    json = require(jsonPath);
} catch(e) {}


/**
 * 更新svn
 */
function svnUpdate() {
    var deferred = q.defer();
    var cmd = util.format("svn update %s --username %s --password %s", settings.project, settings.user, settings.password);

    exec(cmd, function(err, data) {
        if (err) {
            console.log("svn update error: " + err);
            deferred.reject(err);
        } else {
            deferred.resolve(data);
        }
    });

    return deferred.promise;
}

/**
 * 通过svnlook获取更新详细记录
 */
function getUpdateInfo() {
    var deferred = q.defer();
    var cmd = util.format('svnlook changed -r %s %s', args[1], args[0]);

    exec(cmd, function(err, data) {
        if (err) {
            console.log("svn look error: " + err);
            deferred.reject(err);
        } else {
            deferred.resolve(data);
        }
    });

    return deferred.promise;
}

/**
 * 生产json文件
 */
function updateJSON(data) {
    var lines = data.split('\n');

    lines.forEach(function(line) {
        line = line.trim();

        if (line) {
            var mark = line.charAt(0).toLowerCase();
            var key = line.slice(1).trim();

            if (mark == "d") {
                delete json[key];
            } else {
                json[key] = 1;
                // if (/\.(css|js)$/.test(key)) {
                //     json[key] = 1;
                // }
            }
        }
    });

    fs.writeFile(jsonPath, JSON.stringify(json, null, 4), 'utf8');
}

svnUpdate().then(getUpdateInfo).then(updateJSON);
