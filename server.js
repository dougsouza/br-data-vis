// Required Modules
var express    = require("express");
var app        = express();
var bodyParser = require("body-parser");
var fs = require('fs');


var port = process.env.PORT || 3001;
console.log('dirname is ' + __dirname);
app.use(express.static(__dirname+'/'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    next();
});

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html', function(err){
      if(err){
        console.log(err);
      }
      else{
        console.log('home html sent');
      }  
    });
});


app.get('/map', function(req, res){
    res.sendFile(__dirname + '/map.html', function(err){
      if(err){
        console.log(err);
      }
      else{
        console.log('map html sent');
      }  
    });
});

app.get('/time_series', function(req, res){
    res.sendFile(__dirname + '/time_series.html', function(err){
      if(err){
        console.log(err);
      }
      else{
        console.log('time_series html sent');
      }  
    });
});

app.get('/data/bolsaspos/:year', function(req, res){
    var fname = __dirname+'/br-data/bolsas_pos_'+req.params.year+'.json';
    res.send(JSON.parse(fs.readFileSync(fname, 'utf8')));

});


process.on('uncaughtException', function(err) {
    console.log(err);
});

// Start Server
app.listen(port, function () {
    console.log( "Express server listening on port " + port);
});