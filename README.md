This is an asynchronous node js client for the cryptsy.com API.

It exposes all the API methods found here: https://www.cryptsy.com/pages/api

In addition, it exposes a getmarketid method, which accepts a string that describes the desired market in the format 'LTCBTC,' where LTC is the primary currency and BTC is the secondary. All methods are asynchronous, and called in the format client.method(arg1, arg2..., callback) where callback is a function that handles the returned data. The arguments must be passed in order as listed on the API docs linked above.

Example Usage:

```javascript
var market = 'LTCBTC';
var cryptsy = require('cryptsy-api');
var client = new cryptsy('my_public_key', 'my_private_key');

// Get the market ID for the NBL<-->BTC market
client.getmarketid(market, function(market_id) {
	// Display user's trades in that market
	client.mytrades(market_id, null, function(trades) {
		console.log('Your trades in the ' + market + ' market:');
		if(trades.length)
		{
			for(var i in trades)
				console.log('[ID: ' + trades[i].tradeid + ' Date: ' + trades[i].datetime + ' Type: ' + trades[i].tradetype + ' Quantity: ' + trades[i].quantity + ']');
		}
		else
			console.log('You don\'t have any trades in the ' + market + ' market!');
	});
});
```


Credit:

This package was first modeled after the mtgox-apiv2 npm package located here: https://github.com/ameen3/node-mtgox-apiv2.

The methods were modeled after the python client located here: https://github.com/ScriptProdigy/CryptsyPythonAPI.



Feeling generous? Send me a fraction of a bitcoin!

1K1MjEj33GK9V6qn1jbj6wN2EP2hzzwbnx