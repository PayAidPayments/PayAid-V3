var express = require('express'),
    app = express(),
    http = require('http'),
    port = 8888,
    bodyParser = require('body-parser'),
    crypto = require('crypto'),
    API_KEY = "[YOUR-API-KEY]",
    SALT = "[YOUR-SALT]",
	URL = "https://api.payaidpayments.com/v2/paymentrequest",
    server;

app.set('views',__dirname + '/server/views');
app.set('view engine','jade');

app.use('/public', express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use( bodyParser.urlencoded() );
//router handler
app.get('/', function(req, res){
	res.render('form',{action: '.',api_key: API_KEY});
});

app.post('/paymentResponse',function(req,res){
	var shasum = crypto.createHash('sha512'),
        reqData = req.body;
		
		var hash_data = SALT; 
		var keys = Object.keys(reqData),
		i, len = keys.length;

		keys.sort();
		
		for (i = 0; i < len; i++) {
			k = keys[i];
			if(k != 'hash'){
				reqData[k] = reqData[k].toString();
				if(reqData[k].length > 0 ){
					hash_data += '|' + reqData[k];
				}
			}
		}
		
		calculated_hash = shasum.update(hash_data).digest('hex').toUpperCase();	
		if(reqData['hash'] == calculated_hash){
			if(reqData['response_code'] == 0){
				res.render('success',{message: reqData['response_message'],transaction_id:reqData['transaction_id'],amount:reqData['amount']});
			}else{
				res.render('failed',{message: reqData['response_message']});
			}
		}else{
			res.render('failed',{message: 'Hash Mismatch'});
		}
});
//generate SHA512 key and post 
app.post('/paymentRequest',function(req,res){
	var shasum = crypto.createHash('sha512'),
        reqData = req.body;
		
	if(	reqData.amount && reqData.address_line_1 && reqData.city && reqData.name && reqData.email && reqData.phone && reqData.order_id && reqData.currency && reqData.description && reqData.country && reqData.return_url ){
		hash_columns = [
				"address_line_1",
                "address_line_2",
                "amount",
                "api_key",
                "city",
                "country",
                "currency",
                "description",
                "email",
                "mode",
                "name",
                "order_id",
                "phone",
                "return_url",
                "state",
                "udf1",
                "udf2",
                "udf3",
                "udf4",
                "udf5",
                "zip_code"
				];
				
				
		var hash_data = SALT; 
		
		hash_columns.forEach(function(entry) {
			if(entry in reqData){
				if(reqData[entry].length > 0 ){
				hash_data += '|' + reqData[entry];
				}		
			}
		});		
		resultKey = shasum.update(hash_data).digest('hex').toUpperCase();
		res.end(JSON.stringify({"data":resultKey}));
	}else{
		resultKey = '';
		res.end(JSON.stringify({"data":resultKey}));
	}
        
});
//create server
app.listen(port);