const EventEmitter = require('events')
const crypto = require('crypto')
const bl = require('bl')
const querystring = require('querystring')

function findHandler (url, arr) {
  if (!Array.isArray(arr)) {
    return arr
  }

  let ret = arr[0]
  for (let i = 0; i < arr.length; i++) {
    if (url === arr[i].path) {
      ret = arr[i]
    }
  }

  return ret
}

function checkType (options) {
  if (typeof options !== 'object') {
    throw new TypeError('must provide an options object')
  }

  if (typeof options.path !== 'string') {
    throw new TypeError('must provide a \'path\' option')
  }

  if (typeof options.secret !== 'string') {
    throw new TypeError('must provide a \'secret\' option')
  }
}

function create (initOptions) {
  let options
  // validate type of options
  if (Array.isArray(initOptions)) {
    for (let i = 0; i < initOptions.length; i++) {
      checkType(initOptions[i])
    }
  } else {
    checkType(initOptions)
  }

  // make it an EventEmitter
  Object.setPrototypeOf(handler, EventEmitter.prototype)
  EventEmitter.call(handler)

  handler.sign = sign
  handler.verify = verify

  return handler

  function sign (data) {
    return `sha1=${crypto.createHmac('sha1', options.secret).update(data).digest('hex')}`
  }

  function verify (signature, data) {
    const sig = Buffer.from(signature)
    const signed = Buffer.from(sign(data))
    if (sig.length !== signed.length) {
      return false
    }
    return crypto.timingSafeEqual(sig, signed)
  }

  function handler (req, res, callback) {
    let events

    options = findHandler(req.url, initOptions)

    if (typeof options.events === 'string' && options.events !== '*') {
      events = [options.events]
    } else if (Array.isArray(options.events) && options.events.indexOf('*') === -1) {
      events = options.events
    }

    const reqArr = req.url.split('?');
    const reqUrl = reqArr[0];
    const reqQuerystring = reqArr.length > 1 ? reqArr[1] : '';

    const queryParams = querystring.parse(reqQuerystring);
    const platform = Number(queryParams.platform) || 0;

    if (reqUrl !== options.path || req.method !== 'POST') {
      return callback()
    }

    function hasError (msg) {
      res.writeHead(400, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: msg }))

      const err = new Error(msg)

      handler.emit('error', err, req)
      callback(err)
    }

    const sinKey = getHeaderStr(Types.signature,platform);
    const eventKey = getHeaderStr(Types.event,platform);
    const idKey = getHeaderStr(Types.delivery,platform);

    const sig = req.headers[sinKey] || req.headers[sinKey.toLowerCase()]
    const event = req.headers[eventKey] || req.headers[eventKey.toLowerCase()]
    const id = req.headers[idKey] || req.headers[idKey.toLowerCase()]

    if (!sig) {
      return hasError('No '+sinKey+' found on request')
    }

    if (!event) {
      return hasError('No '+eventKey+' found on request')
    }

    if (!id) {
      return hasError('No '+idKey+' found on request')
    }
    if (events && events.indexOf(event) === -1) {
      return hasError(eventKey + ' is not acceptable')
    }

    req.pipe(bl((err, data) => {
      
      if (err) {
        return hasError(err.message)
      }
      
      let obj

      if (!verify(sig, data)) {
        return hasError(sinKey + ' does not match blob signature')
      }

      try {
        let dstr = data.toString();
        let str = unescape(dstr.replace('payload=',''));
        obj = JSON.parse(str);
        
      } catch (e) {
        return hasError(e)
      }

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end('{"ok":true}')

      const emitData = {
        event: event,
        id: id,
        payload: obj,
        protocol: req.protocol,
        host: req.headers.host,
        url: req.url,
        path: options.path
      }

      handler.emit(event, emitData)
      handler.emit('*', emitData)
    }))
  }
}

const Types = {
    signature:'signature',
    event: 'event',
    delivery: 'delivery',
}

const gitHubHeaders = {
    signature: 'x-hub-signature',
    event: 'x-github-event',
    delivery: 'x-github-delivery',
};
const codingNetHeaders = {
    signature: 'X-Coding-Signature',
    event: 'X-Coding-Event',
    delivery: 'X-Coding-Delivery',
};
//默认是0，github
function getHeaderStr(type, platform){
    let header = null;
    switch(platform){
        case 0:
            header = gitHubHeaders[type];
            break;
        case 1:
            header = codingNetHeaders[type];
            break;
        default:
            header = gitHubHeaders[type];
            break;
    }
    return header;
    

}


module.exports = create
