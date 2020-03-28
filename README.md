# 自动化部署(autoDeploy)

## 说明

本仓库功能主要使用node搭建webhook服务，支持webhook的钩子回调事件。通过监听webhook的回调实现了在服务器的代码自动部署功能。


## 使用方法

### 1、配置服务项目实例 

> 配置文件为 config.js

```javascript
module.exports = {
  serversConfig: {
    appName: {
      path: "/data/www/", //服务器的项目部署地址
      events: ['push','ping'],//webhook的钩子事件
      commands: ['npm run build'] //自动部署完成后执行的脚本。（自动更新代码的逻辑已经内置）
    }
  },
  webhookConfig:{
    path:'/autoDeploy',//webhook的回调api的地址路径，即下面示例中的路径地址
    secret:'123456' //webhook的秘钥
  }
};
```


### 2、配置webhook地址

示例
```
http://服务器ip:3000/autoDeploy?platform=1&app=appName
```
参数说明

参数名|描述|值类型|取值范围
---|:--:|---:|---:|
platform|平台|number|0(github.com),1(coding.net)
app|项目名称|string|跟config中的appName保持一致

### 3、在服务器的当前代码仓库目录启动服务

> 本项目支持 pm2 启动服务

启动服务的命令： pm2 start

# License
MIT