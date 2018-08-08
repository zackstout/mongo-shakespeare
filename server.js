
var express = require('express');
var app = express();

var port = process.env.PORT || 7455;
var bodyParser = require('body-parser');

var router = require('./router/router.js');

app.use(bodyParser.json());
// Needed this!!!:
app.use(bodyParser.urlencoded({
  extended: true
}));

// Can't have a slash here:
app.use(express.static('public'));

app.use('/', router);

var mongoose = require('mongoose');
var databaseUrl = '';

if(process.env.MONGODB_URI) {
    databaseUrl = process.env.MONGODB_URI;
} else {
    databaseUrl = 'mongodb://localhost:27017/shakin';
}

mongoose.connection.on('connected', function() {
  console.log('we in!');
});

mongoose.connection.on('error', function() {
  console.log("aw nuts bro");
});

//initiate connection:
mongoose.connect(databaseUrl);

app.listen(port, function (req, res) {
  console.log('Listening on port', port);
});
