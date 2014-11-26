var fs = require('fs');
var path = require('path');
var util = require('util');
var exec = require('child_process').exec;
var args = process.argv.splice(2);

var jsonPath = path.join(__dirname, '../json/update.json');
var json = {};

// 读取更新信息
// 第一个参数为目录
var cmd = util.format('svnlook changed -r %s %s', args[1], args[0]);

try {
    json = require(jsonPath);
} catch(e) {}

exec(cmd, {

}, function(err, data) {
    if (err) {
        console.error(err);
    } else {
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
                }
            }
        });

        fs.writeFile(jsonPath, JSON.stringify(json, null, 4), 'utf8');
    }
});
