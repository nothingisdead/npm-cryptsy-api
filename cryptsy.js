var stringify     = require("querystring").stringify,
    hmac          = require("crypto").createHmac,
    request       = require("request"),
    publicMethods = ['marketdata','marketdatav2','orderdata','singleorderdata','singlemarketdata'];

function CryptsyClient(key, secret) {
  var self    = this;
  self.key    = key;
  self.secret = secret;
  self.jar    = request.jar();

  function api_query(method, callback, args)
  {
    var args_tmp = {};

    for(i in args) {
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
      var error = null;

      if(!body || !res || res.statusCode != 200) {
        error = "Error in server response.";

        setTimeout(function() {
          api_query(method, callback, args);
        }, 500);
      }
      else {
        var response = JSON.parse(body);

        if(response.error) {
          error = response.error;
        }
      }

      if(typeof callback === 'function') {
        if(error) {
          callback.call(this, error, null);
        }
        else {
          callback.call(this, null, response.return);
        }
      }
    });
  }

  // This function gets the market id for a market in the format 'LTCBTC'
  self.getmarketid = function(marketname, callback) {
    if(typeof callback !== 'function') {
      throw new Error("'callback' argument must be a function.");
    }

    if(!self.markets || !Object.keys(self.markets).length) {
      self.getmarkets(function(error, markets) {
        callback.call(this, error, markets[marketname]);
      });
    }
    else {
      callback.call(this, null, self.markets[marketname]);
    }
  };

  // Old API method
  self.marketdata = function(callback) {
    api_query('marketdata', callback);
  }

  // New API method
  self.marketdatav2 = function(callback) {
    api_query('marketdatav2', callback);
  }

  self.singlemarketdata = function(marketid, callback) {
    api_query('singlemarketdata', callback, { marketid: marketid });
  }

  self.orderdata = function(callback) {
    api_query('orderdata', callback);
  }

  self.singleorderdata = function(marketid, callback) {
    api_query('singleorderdata', callback, { marketid: marketid });
  }

  self.getinfo = function(callback) {
    api_query("getinfo", callback);
  }

  self.getmarkets = function(callback) {
    callback2 = function(error, markets) {
      self.markets = {};
      for(var i in markets)
      {
        var primary   = markets[i].primary_currency_code;
        var secondary = markets[i].secondary_currency_code;

        self.markets[primary + secondary] = markets[i].marketid;
      }
      callback(error, self.markets);
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

  self.allmytradesdaterange = function(dates, callback) {
    api_query('allmytrades', callback, { startdate: dates.startdate, enddate: dates.enddate });
  }

  self.myorders = function(marketid, callback) {
    api_query('myorders', callback, { marketid: marketid });
  }

  self.depth = function(marketid, callback) {
    api_query('depth', callback, { marketid: marketid });
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

  self.mytransfers = function(callback) {
    api_query('mytransfers', callback);
  }

  self.getwalletstatus = function(callback) {
    api_query('getwalletstatus', callback);
  }

  self.makewithdrawal = function(address, amount, callback) {
    api_query('makewithdrawal', callback, { address: address, amount: amount });
  }
}

module.exports = CryptsyClient;
