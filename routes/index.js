var util = require('util');
var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;

var express = require('express');
var router = express.Router();

var uglify = require('uglify-js');
var Clean = require('clean-css');
var fse = require('fs-extra');

var settings = {};

try {
    settings = require(normalizePath('../settings'));
} catch (e) {}


// temp dir
fse.ensureDirSync(normalizePath('../tmp'));

// json备份
fse.ensureDirSync(normalizePath('../backup/json'));

// 提交包备份
fse.ensureDirSync(normalizePath('../backup/src'));

// 发布包备份
fse.ensureDirSync(normalizePath('../backup/dist'));


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

/*
 * code
 * 创建目录会失败？ 201 - 210预留
 * 211 拷贝源文件到tmp目录失败
 */
router.post('/commit', function(req, res) {
    var code = 100,
        msg = 'success',
        data = JSON.parse(req.param('data')) || [],
        result = {};

    var stamp = formatDate("Ymdhis"),
        // 保存源文件
        srcPath = normalizePath('../tmp/src' + stamp +  '/tbtx/'),
        // 保存压缩文件
        distPath = normalizePath('../tmp/dist' + stamp + '/tbtx');

    fse.ensureDirSync(srcPath);
    fse.ensureDirSync(distPath);

    // 删除上面创建的临时目录
    var clearDir = function() {
        fse.removeSync(srcPath);
        fse.removeSync(distPath);
    };

    var ret = function() {
        // clearDir();

        res.send({
            code: code,
            msg: msg,
            result: result
        });
    };

    // forEach不能跳出循环
    data.every(function(item) {
        var name = item.name || '',
            compressed = item.compressed,
            ext = path.extname(name);

        var filePath = path.join(settings.project, name),
            srcContent = '',        // 源文件内容，css压缩时使用
            distContent = '';

        console.log("filePath:" + filePath);
        console.log("ext:" + ext);
        try {
            fse.copySync(filePath, path.join(srcPath, name));
        } catch(e) {

            code = 211;
            msg = "copy source file to tmp dir error";
            result.error = e.message;
            result.file = filePath;
            ret();

            return false;
        }

        // 需要压缩
        if (compressed) {

            if (ext === '.css') {

                try {
                    srcContent = fs.readFileSync(filePath, {
                        encoding: 'utf8'
                    });

                    distContent =  new Clean({

                    }).minify(srcContent);

                    fse.outputFileSync(path.join(distPath, name), distContent);
                } catch(e) {

                    code = 221;
                    msg = "compress css file error";
                    result.error = e.message;
                    result.file = filePath;
                    ret();

                    return false;
                }

            } else if(ext === '.js') {
                try {
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

                    fse.outputFileSync(path.join(distPath, name), distContent);
                } catch (e) {
                    code = 231;
                    msg = "compress js file error";
                    result.error = e.message;
                    result.file = filePath;
                    ret();

                    return false;
                }
            } else {
                try {
                    fse.copySync(filePath, path.join(distPath, name));
                } catch(e) {
                    code = 241;
                    msg = "copy file to dist dir error";
                    result.error = e.message;
                    result.file = filePath;
                    ret();

                    return false;
                }
            }
        } else {
            try {
                fse.copySync(filePath, path.join(distPath, name));
            } catch(e) {
                code = 241;
                msg = "copy file to dist dir error";
                result.error = e.message;
                result.file = filePath;
                ret();

                return false;
            }
        }
        return true;
    });

    ret();
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
