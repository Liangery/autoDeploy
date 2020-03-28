module.exports = {
  serversConfig: {
    blog: {
      path: "/data/www/shannonliang.github.io",
      events: ['push'],
    },
    lifedServer: {
      path: "/data/www/api.lifed.gaoyongliang.com/lifed-server",
      events: ['push','ping'],
      commands: ['npm run build']
    }
  },
  webhookConfig:{
    path:'/autoDeploy',
    secret:'123456'
  }
};
