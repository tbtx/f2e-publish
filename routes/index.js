var util = require('util');
var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;

var express = require('express');
var router = express.Router();

var uglify = require('uglify-js');
var Clean = require('clean-css');
var fse = require('fs-extra');
var q = require('q');
var moment = require('moment');

var settings = {};
try {
    settings = require(normalizePath('../settings'));
} catch (e) {}


var backupDirs = {
    json: normalizePath('../backup/json'),
    src: normalizePath('../backup/src'),
    dist: normalizePath('../backup/dist'),
    min: normalizePath('../backup/min'),

    // 项目包备份
    project: normalizePath('../backup/project')
}

// temp dir
fse.ensureDirSync(normalizePath('../tmp'));

// json备份
fse.ensureDirSync(backupDirs.json);

// 提交包备份
fse.ensureDirSync(backupDirs.src);

// 发布包备份
fse.ensureDirSync(backupDirs.dist);

// 压缩后的代码
fse.ensureDirSync(backupDirs.min);

/* GET home page. */
router.get('/', function(req, res) {

    var updates = {};

    try {
        // 用require会有缓存
        updates = fse.readJSONSync(normalizePath('../update.json'));
    } catch (e) {}

    var ret = [],
        i;

    // 没有后缀名的过滤，如目录，一些特殊文件
    for (i in updates) {
        if (path.extname(i)) {
            ret.push(i);
        }
    }

    res.render('index', {
        updates: ret
    });

});


router.post('/commit', function(req, res) {
    var code = 100,
        msg = 'success',
        data = JSON.parse(req.param('data')) || [],
        result = {};


    var jsonPath = normalizePath('../update.json'),
        updates = {};

    try {
        updates = fse.readJSONSync(jsonPath);
    } catch(e) {}


    var stamp = moment().format("YYYYMMDDHHmmss"),
        // 在压缩后的头部加上时间注释
        header = util.format('/* %s */\n', stamp);
        // 保存源文件
        srcPath = normalizePath('../tmp/src' + stamp +  '/tbtx'),
        // 保存压缩文件
        distPath = normalizePath('../tmp/dist' + stamp + '/tbtx');

    fse.ensureDirSync(srcPath);
    fse.ensureDirSync(distPath);

    var ret = function() {
        // 删除上面创建的临时目录
        fse.removeSync(path.join(srcPath, ".."));
        fse.removeSync(path.join(distPath, ".."));

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

        try {
            fse.copySync(filePath, path.join(srcPath, name));
        } catch(e) {

            code = 211;
            msg = "copy commit file to src dir error";
            result.error = e.message;
            result.file = filePath;

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

                    fse.outputFileSync(path.join(distPath, name), header + distContent);
                    fse.outputFileSync(path.join(backupDirs.min, name), header + distContent);
                } catch(e) {

                    code = 221;
                    msg = "compress css file error";
                    result.error = e.message;
                    result.file = filePath;

                    return false;
                }

            } else if(ext === '.js') {
                try {
                    distContent = uglify.minify(filePath, {
                        mangle: true,
                        output: {
                            // 汉字编码为Unicode
                            ascii_only: true
                        },
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
                    }).code;

                    fse.outputFileSync(path.join(distPath, name), header + distContent);
                    fse.outputFileSync(path.join(backupDirs.min, name), header + distContent);
                } catch (e) {
                    code = 226;
                    msg = "compress js file error";
                    result.error = e.message;
                    result.file = filePath;

                    return false;
                }
            } else {
                try {
                    fse.copySync(filePath, path.join(distPath, name));
                } catch(e) {
                    code = 231;
                    msg = "copy file to dist dir error";
                    result.error = e.message;
                    result.file = filePath;

                    return false;
                }
            }
        } else {
            try {
                fse.copySync(filePath, path.join(distPath, name));
            } catch(e) {
                code = 231;
                msg = "copy file to dist dir error";
                result.error = e.message;
                result.file = filePath;

                return false;
            }
        }

        delete updates[name];
        return true;
    });

    if (code !== 100) {
        ret();
    } else {
        q.all([
            tar(path.join(backupDirs.src, "tbtx_" + stamp), srcPath),
            tar(path.join(backupDirs.dist, "tbtx_" + stamp), distPath)
        ]).then(function() {
            // 备份json
            fse.copySync(jsonPath, path.join(backupDirs.json, "update_" + stamp + ".json"));
            // 更新json
            fse.outputJSONSync(jsonPath, updates);

            result.packagePath = path.join("/backup/dist/", "tbtx_" + stamp + ".tar.gz");
            ret();
        }, function() {
            code = 251;
            msg = "tar error";

            ret();
        });
    }

});

router.get('/pack/project', function(req, res) {

    fse.ensureDirSync(backupDirs.project);

    var stamp = moment().format("YYYYMMDDHHmmss");

    tar(path.join(backupDirs.project, "tbtx_" + stamp), settings.project)
    .then(function() {
        res.redirect("/backup/project/" + "tbtx_" + stamp + ".tar.gz");
    }).fail(function(err) {
        next(err);
    });

});


function tar(name, dir) {
    var deferred = q.defer();

    var basename = path.basename(dir),
        dirname = path.dirname(dir);

    var cmd = util.format("tar -zcvf %s.tar.gz %s", name, basename);

    // dir /xx/xx/f2e-publish/tmp/src20141129030256/tbtx
    exec(cmd, {
        cwd: dirname
    }, function(err, data) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(data);
        }
    });

    return deferred.promise;
}

function normalizePath(relative) {
    return path.join(__dirname, relative);
}

module.exports = router;
