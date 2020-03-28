var http = require('http');
var createHandler = require("./webhook-handler.js");
const { serversConfig,webhookConfig } = require('../config.js');
const {runCommandSh,getAllEvents } = require('./util.js');
const querystring = require('querystring');

// 下面填写的myscrect跟github webhooks配置一样，下一步会说；path是我们访问的路径
var handler = createHandler({ path: webhookConfig.path, secret: webhookConfig.secret });
 
http.createServer(function (req, res) {
  handler(req, res, function (err) {
    console.log('error, handler callback');
    res.statusCode = 404;
    res.body = 'no location';
  })
}).listen(3000);
 
handler.on('error', function (err) {
  console.error('Error:', err.message)
});




getAllEvents(serversConfig).forEach(event=>{
  // 监听到 event 事件的时候执行我们的自动化脚本
  handler.on(event, function(res) {
    const query = res.url.indexOf('?') > -1 ? res.url.split('?')[1] : '';
    const params = query ? querystring.parse(query) : {};
    const appName = params.app;
    if(!appName || !serversConfig[appName] || !serversConfig[appName].path || serversConfig[appName].events.indexOf(event) == -1){
      return;
    }
    console.log(params,event,appName);
    runCommandSh(serversConfig[appName]);
  });
});
  
  
