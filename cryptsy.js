var stringify   = require("querystring").stringify,
  hmac          = require("crypto").createHmac,
  request       = require("request"),
  publicMethods = ['marketdata','marketdatav2','orderdata','orderdatav2','singleorderdata','singlemarketdata'];

function CryptsyClient(key, secret, requeue) {
  var self     = this;

  self.key     = key;
  self.secret  = secret;
  self.jar     = request.jar();
  self.requeue = requeue || 0;

  function api_query(method, callback, args)
  {
    var args_tmp = {};

    for(var i in args) {
      if(args[i]) {
        args_tmp[i] = args[i];
      }
    }

    args = args_tmp;

    var options = {
      uri     : 'https://api.cryptsy.com/api',
      agent   : false,
      method  : 'POST',
      jar     : self.jar,
      headers : {
        "User-Agent": "Mozilla/4.0 (compatible; Cryptsy API node client)",
        "Content-type": "application/x-www-form-urlencoded"
      }
    };

    args.method = method;

    if(publicMethods.indexOf(method) > -1)
    {
      options.method = 'GET';
      options.uri    = 'http://pubapi.cryptsy.com/api.php?' + stringify(args);
    }
    else
    {
      if (!self.key || !self.secret) {
        throw new Error("Must provide key and secret to make this API request.");
      }
      else
      {
        args.nonce = new Date().getTime();

        var message        = stringify(args);
        var signed_message = new hmac("sha512", self.secret);

        signed_message.update(message);

        options.headers.Key  = self.key;
        options.headers.Sign = signed_message.digest('hex');
        options.body         = message;
      }
    }
    request(options, function(err, res, body) {
      if(!body || !res || res.statusCode != 200) {
        var requeue = +self.requeue;

        if(requeue) {
          setTimeout(function() {
            api_query(method, callback, args);
          }, requeue);
        }
        else if(typeof callback === 'function') {
          callback.call(this, "Error in server response", null);
        }
      }
      else {
        var error  = null;
        var result = null;

        try {
          var response = JSON.parse(body);

          if(response.error) {
            error = response.error;
          }
          else {
            result = response.return || response;
          }
        }
        catch(e) {
          error = "Error parsing server response: " + e.message;
        }

        if(typeof callback === 'function') {
          callback.call(this, error, result);
        }
      }
    });
  }

  function getMarketIds(callback) {
    var callback2 = function(error, markets) {
      self.markets = {};

      for(var i in markets) {
        var primary   = markets[i].primary_currency_code;
        var secondary = markets[i].secondary_currency_code;

        self.markets[primary + secondary] = markets[i].marketid;
      }

      callback(error, self.markets);
    };

    self.getMarkets(callback2);
  }

  // This function gets the market id for a market in the format 'LTCBTC'
  self.getMarketId = function(marketname, callback) {
    if(typeof callback !== 'function') {
      throw new Error("'callback' argument must be a function.");
    }

    if(!self.markets || !Object.keys(self.markets).length) {
      getMarketIds(function(error, markets) {
        callback.call(this, error, markets[marketname]);
      });
    }
    else {
      callback.call(this, null, self.markets[marketname]);
    }
  };

  // Old API method
  self.marketData = function(callback) {
    api_query('marketdata', callback);
  };

  // New API method
  self.marketDatav2 = function(callback) {
    api_query('marketdatav2', callback);
  };

  self.singleMarketData = function(marketid, callback) {
    api_query('singlemarketdata', callback, { marketid: marketid });
  };

  self.orderData = function(callback) {
    api_query('orderdata', callback);
  };

  self.orderDatav2 = function(callback) {
    api_query('orderdatav2', callback);
  };

  self.singleOrderData = function(marketid, callback) {
    api_query('singleorderdata', callback, { marketid: marketid });
  };

  self.getInfo = function(callback) {
    api_query("getinfo", callback);
  };

  self.getMarkets = function(callback) {
    api_query('getmarkets', callback);
  };

  self.myTransactions = function(callback) {
    api_query('mytransactions', callback);
  };

  self.marketTrades = function(marketid, callback) {
    api_query('markettrades', callback, { marketid: marketid });
  };

  self.marketOrders = function(marketid, callback) {
    api_query('marketorders', callback, { marketid: marketid });
  };

  self.myTrades = function(marketid, limit, callback) {
    api_query('mytrades', callback, { marketid: marketid, limit: limit });
  };

  self.allMyTrades = function(callback) {
    api_query('allmytrades', callback);
  };

  self.allMyTradesDateRange = function(dates, callback) {
    api_query('allmytrades', callback, { startdate: dates.startdate, enddate: dates.enddate });
  };

  self.myOrders = function(marketid, callback) {
    api_query('myorders', callback, { marketid: marketid });
  };

  self.depth = function(marketid, callback) {
    api_query('depth', callback, { marketid: marketid });
  };

  self.allMyOrders = function(callback) {
    api_query('allmyorders', callback);
  };

  self.createOrder = function(marketid, ordertype, quantity, price, callback) {
    api_query('createorder', callback, { marketid: marketid, ordertype: ordertype, quantity: quantity, price: price });
  };

  self.cancelOrder = function(orderid, callback) {
    api_query('cancelorder', callback, { orderid: orderid });
  };

  self.cancelMarketOrders = function(marketid, callback) {
    api_query('cancelmarketorders', callback, { marketid: marketid });
  };

  self.calculateFees = function(ordertype, quantity, price, callback) {
    api_query('calculatefees', callback, { ordertype: ordertype, quantity: quantity, price: price });
  };

  self.myTransfers = function(callback) {
    api_query('mytransfers', callback);
  };

  self.getWalletStatus = function(callback) {
    api_query('getwalletstatus', callback);
  };

  self.makeWithdrawal = function(address, amount, callback) {
    api_query('makewithdrawal', callback, { address: address, amount: amount });
  };

  self.getOrderStatus = function(orderid, callback) {
    api_query('getorderstatus', callback, { orderid: orderid });
  };

}

module.exports = CryptsyClient;
