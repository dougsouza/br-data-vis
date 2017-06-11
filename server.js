// EXPRESS SETUP
var express = require('express'),
    body_parser = require('body-parser'),
    port = process.env.PORT || 3001,
    app = express();

var fs = require('fs');

app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    next();
});

app.use(body_parser.urlencoded({ extended: true }));
app.use(body_parser.json());
app.use(express.static(__dirname+'/'));
// --------------------


// ROUTES SETUP
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/data/bolsaspos/:year', function(req, res) {
    var file_name = __dirname + '/br-data/bolsas_pos_' + req.params.year + '.json';
    res.send(JSON.parse(fs.readFileSync(file_name, 'utf8')));
});
// --------------------


app.listen(port, function() {
    console.log('Application started on port: ' + port);
});
