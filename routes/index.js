var util = require('util');
var path = require('path');
var exec = require('child_process').exec;

var express = require('express');
var router = express.Router();

var uglify = require('uglify-js');
var clean = require('clean-css');
var fse = require('fs-extra');

var settings = {};

try {
    settings = require(normalizePath('../settings'));
} catch (e) {}



// backup, tmp

fse.ensureDirSync(normalizePath('../tmp'));


// json备份
fse.ensureDirSync(normalizePath('../backup/json'));

// 提交包备份
fse.ensureDirSync(normalizePath('../backup/commit'));

// 发布包备份
fse.ensureDirSync(normalizePath('../backup/package'));


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
        msg = 'success',
        data = JSON.parse(req.param('data')) || [];

    var stamp = formatDate("Ymdhis"),
        // 保存源文件
        srcPath = normalizePath('../tmp/src' + stamp +  '/tbtx/'),
        // 保存压缩文件
        distPath = normalizePath('../tmp/dist' + stamp + '/tbtx');

    fse.ensureDirSync(srcPath);
    fse.ensureDirSync(distPath);

    data.forEach(function(item) {
        var name = item.name || '',
            compressed = item.compressed,
            ext = path.extname(name);

        var filePath = path.join(settings.project, name),
            distContent = '';

        fse.copySync(filePath, path.join(srcPath, name));

        // 需要压缩
        if (compressed) {
            if (ext === '.css') {
                clean();
            } else if(ext === '.js') {
                distContent = uglify.minify(filePath, {
                    mangle: true,
                    compress: {
                        booleans: true,         // 多种针对布尔上下文的优化
                        conditionals: true,     // 为if -s 和条件表达式应用优化
                        dead_code: true,       // 移除不可达的代码
                        drop_console: true,      // 删除console代码
                        drop_debugger: true,       // 删除debugger语句
                        if_return: true,        // 这对 if/return 和 if/continue 的优化
                        join_vars: true,        // 加入连续的var语句
                        properties: true,       // 使用obj.x 代替 obj[x]
                        sequences: true,        // 使用逗号操作符加入连续的简单语句
                        unused: true            // 去掉没有被引用过的函数和变量
                    }
                });
            } else {

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
