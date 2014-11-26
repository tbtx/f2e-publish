var fs = require('fs');
var path = require('path');
var util = require('util');
var args = process.argv.splice(2);

var updateInfo = 'a.txt';

var jsonPath = path.join(__dirname, '../json/update.json');
var json = {};

// 读取更新信息
var cmd = util.format('svnlook changed -r %s %s', 5, "10");

console.log(cmd);

try {
    json = require(jsonPath);
} catch(e) {}

fs.readFile(updateInfo, 'utf-8', function(err, data) {
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
