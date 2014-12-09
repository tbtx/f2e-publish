f2e-publish
===========

tbtx f2e publish service

## 准备

在服务器上创建一个SVN仓库以及一个SVN项目库

## 安装

    npm install

    仿照settings.example.js创建配置settings.js里的svn项目地址，用户名和密码来执行svn 更新

    拷贝hooks/svn.hooks到svn仓库的hooks/post-commit并给其执行权限，修改里面的HANDLER路径为hooks/svnHandler.js里绝对路径，
    node的bin目录可能在/user/local/bin里，根据自己的环境修改

## 运行

    // PORT可以不指定，永久设置使用export PORT=1234
    PORT=1234 forever start -c "npm start" ./ 或者 forever start ./bin/www

## 停止

    forever stop -c "npm start" ./ 或者 forever stop ./bin/www

## nginx

    参照conf下nginx，修改项目目录即可
