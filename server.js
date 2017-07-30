const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const requestIp = require('request-ip');
const axios = require('axios');
const fs = require('fs');
const Search = require('./models/Search');

const app = express();

//for google custom search API
const SearchUrl = 'https://www.googleapis.com/customsearch/v1';
const API_KEY = 'AIzaSyD-J2IzmO9jhx-UzwYzYtzfZV7J4WZnpUQ';
const CX = '016598263194926047847:gneq6adkvgo';


app.set('port', (process.env.PORT || 3000));

// connect to mongodb
mongoose.connect('mongodb://sangtran:password@ds129013.mlab.com:29013/images-searches');
mongoose.Promise = global.Promise;

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

// error handling middleware
app.use(function(err, req, res, next){
    console.log(err); // to see properties of message in our console
    res.status(422).send({error: err.message});
});

app.get('/', function(req,res, next){
	res.render('index');
})

app.get('/api/imagesearch/:search', function(req,res,next){
	//get info
	const ipInfo = "http://ipinfo.io/" + requestIp.getClientIp(req);
	const ipInfo2 = "http://ipinfo.io/"+"45.3.11.94";

	// Make a request for a user with a given ID
	axios.get(ipInfo)
	.then(function (response) {
		//console.log(response.data);
		const location = response.data.region + ", " + response.data.country + " @ " + response.data.ip;
		const searchQuery = {
			term: req.params.search,
			when: new Date().toString(),
			from: location
		};

		//store Search in db
		Search.create(searchQuery).then((search) => {
			//get object put into app
			console.log("Going Back to client");
		}).catch(next);

	}).catch(function (error) {
		console.log(error);
	});

	// console.log('params');
	// console.log(req.params.search);
	console.log('queries');
	console.log(req.query);

	//fetch search results
	//2nd fetch requests
	axios.get('https://www.googleapis.com/customsearch/v1', {
    params: {
      q: req.params.search,
      cx:CX,
      num:10,
      searchType:'image',
      start:parseInt(req.query.offset) || 1,
      key:API_KEY
    }
  })
  .then(function (response) {
  	var items = [];
  	//parsing data into nicer looking item objects
  	response.data.items.forEach((currentItem) => {
  		var item = {
  			url:currentItem.link,
  			snippet:currentItem.snippet,
  			thumbnail:currentItem.image.thumbnailLink,
  			context:currentItem.image.contextLink
  		}
  		items.push(item);
  	})
  	res.json(items);
  })
  .catch(function (error) {
    console.log(error);
  });
});

//retrieve past searches
app.get('/api/latest/imagesearch', function(req,res, next){
	var results = [];
	Search.find({}).sort({$natural:-1}).then((searches) => {
		for (var i = 0; i < searches.length; i++) {
			var result = {
				term:searches[i].term,
				when:searches[i].when,
				from:searches[i].from
			}

			results.push(result);
		}

		res.json(results);
	}).catch(next);
});

//The 404 Route (ALWAYS Keep this as the last route)
app.get('*', function(req, res){
  res.send('Whoops404 error page check your URL please.', 404);
});



// listen for requests
app.listen(process.env.port || app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});