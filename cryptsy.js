var stringify = require("querystring").stringify,
    hmac = require("crypto").createHmac,
    request = require("request");

function CryptsyClient(key, secret) {
  var self = this;
  self.key = key;
  self.secret = secret;

  function api_query(method, callback, args)
  {
    var args_tmp = {};

    for(i in args)
      if(args[i])
        args_tmp[i] = args[i];

    args = args_tmp;

    var options = {
      uri: 'https://www.cryptsy.com/api',
      agent: false,
      method: 'POST',
      headers: {
        "User-Agent": "Mozilla/4.0 (compatible; Cryptsy API node client)",
        "Content-type": "application/x-www-form-urlencoded"
      }
    };
    args.method = method;
    if(method == 'marketdata' || method == 'orderdata')
    {
      options.uri += '.php?' + stringify(args);
    }
    else
    {
      if (!self.key || !self.secret) {
        throw new Error("Must provide key and secret to make this API request.");
      }
      else
      {
        args.nonce = new Date().getTime();
        var message = stringify(args);
        var signed_message = new hmac("sha512", self.secret);
        signed_message.update(message);
        options.headers.Key = self.key;
        options.headers.Sign = signed_message.digest('hex');
        options.body = message;
      }
    }
    request(options, function(err, res, body) {
      var response = JSON.parse(body);
      if(parseInt(response.success) === '1' && typeof callback == typeof Function)
        callback(response.return);
      else if(response.error)
        throw new Error(response.error);
    });
  }

  // This function gets the market id for a market in the format 'LTCBTC'
  self.getmarketid = function(marketname, callback) {
    if(!self.markets || !self.markets.length)
    {
      self.getmarkets(function() {
        callback(self.markets[marketname]);
      });
    }
    else
      callback(self.markets[marketname]);
  };

  self.marketdata = function(callback) {
    api_query('marketdata', callback);
  }

  self.orderdata = function(callback) {
    api_query('orderdata', callback);
  }

  self.getinfo = function(callback) {
    api_query("getinfo", callback);
  }

  self.getmarkets = function(callback) {
    callback2 = function(markets) {
      self.markets = {};
      for(var i in markets)
      {
        self.markets[markets[i].primary_currency_code + markets[i].secondary_currency_code] = markets[i].marketid;
      }
      callback(markets);
    }
    api_query('getmarkets', callback2);
  }

  self.mytransactions = function(callback) {
    api_query('mytransactions', callback);
  }

  self.markettrades = function(marketid, callback) {
    api_query('markettrades', callback, { marketid: marketid });
  }

  self.marketorders = function(marketid, callback) {
    api_query('marketorders', callback, { marketid: marketid });
  }

  self.mytrades = function(marketid, limit, callback) {
    api_query('mytrades', callback, { marketid: marketid, limit: limit })
  }

  self.allmytrades = function(callback) {
    api_query('allmytrades', callback);
  }

  self.myorders = function(marketid, callback) {
    api_query('myorders', callback, { marketid: marketid });
  }

  self.allmyorders = function(callback) {
    api_query('allmyorders', callback);
  }

  self.createorder = function(marketid, ordertype, quantity, price, callback) {
    api_query('createorder', callback, { marketid: marketid, ordertype: ordertype, quantity: quantity, price: price });
  }

  self.cancelorder = function(orderid, callback) {
    api_query('cancelorder', callback, { orderid: orderid });
  }

  self.calculatefees = function(ordertype, quantity, price, callback) {
    api_query('calculatefees', callback, { ordertype: ordertype, quantity: quantity, price: price });
  }
}

module.exports = CryptsyClient;
