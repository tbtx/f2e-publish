var util = require('util');
var path = require('path');
var exec = require('child_process').exec;

var express = require('express');
var router = express.Router();

var fse = require('fs-extra');

var settings = {};

try {
    settings = require(normalizePath('../settings'));
} catch (e) {}



// backup, tmp

fse.ensureDir(normalizePath('../tmp'));


// json备份
fse.ensureDir(normalizePath('../backup/json'));

// 提交包备份
fse.ensureDir(normalizePath('../backup/commit'));

// 发布包备份
fse.ensureDir(normalizePath('../backup/package'));


// function rmdir(dirpath) {
//     try {
//         fse.rmdirSync(path.join(__dirname, dirpath));
//     } catch (e) {}
// }

/* GET home page. */
router.get('/', function(req, res) {

    var updates = {};

    try {
        updates = require(normalizePath('../update.json'));
    } catch (e) {}

    res.render('index', {
        updates: updates
    });

});

router.post('/commit', function(req, res) {
    var code = 100,
        msg = 'success';

    var data = JSON.parse(req.param('data')) || [];
    var stamp = formatDate("Ymdhis");

    data.forEach(function(item) {
        var name = item.name || '',
            compressed = item.compressed,
            ext = path.extname(name);

        // 需要压缩
        if (compressed) {
            if (ext === '.css') {

            } else if(ext === '.js') {

            }
        }

    });

    res.send({
        code: code,
        msg: msg
    });
});

function normalizePath(relative) {
    return path.join(__dirname, relative);
}

function formatDate(format) {
    format = format || "Y-m-d h:i:s";

    var date = new Date();
    var normalized = {
        Y: date.getFullYear(),
        M: date.getMonth() + 1,
        D: date.getDate(),
        H: date.getHours(),
        I: date.getMinutes(),
        S: date.getSeconds()
    };

    for (var i in normalized) {
        normalized[i.toLowerCase()] = padding2(normalized[i]).slice(-2);
    }

    return format.replace(/y|m|d|h|i|s/gi, function(k) {
        return normalized[k];
    });
}

function padding2(str) {
    str += "";
    return str.length === 1 ? "0" + str : str;
}

module.exports = router;
