f2e-publish
===========

tbtx f2e publish service

## 安装

    npm install

    仿照settings.example.js创建配置settings.js里的svn地址，用户名和密码

    拷贝到svn项目的hooks/post-commit，修改hooks/svn.hooks里的handler路径

## 运行

    // PORT可以不指定，永久设置使用export PORT=1234
    PORT=1234 forever start -c "npm start" ./ 或者 forever start ./bin/www

## 停止

    forever stop -c "npm start" ./ 或者 forever stop ./bin/www

## nginx

    参照conf下nginx，修改项目目录即可
