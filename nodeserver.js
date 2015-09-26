/*
 * Node server for timekpr syncing.
 * Also servers the HTML UI (via express.static).
 */

var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');

var app = express();

/* send the whole json file.
 * the url is /timekpr/getdata.lua to mimic the fritz.box-Interface
 * lua is not used in any way
 */
app.get('/timekpr/getdata.lua', function (req, res) {
  fs.readFile('timekpr-data.json', 'utf8', function (err, json_text) {
    res.setHeader('Content-Type', 'application/json');
    if (err) {
      res.send('{ "error": "Database not readable: ' + err + '"}');
    }
    else {
      res.send(json_text);
    }
  });
});

/* store the sent json file and return the input back
 * the url is /timekpr/setdata.lua to mimic the fritz.box-Interface
 * lua is not used in any way
 */
app.use(bodyParser.urlencoded({ extended: true }));
app.post('/timekpr/setdata.lua', function (req, res) {
  fs.writeFile('timekpr-data.json', req.body.json, function (err) {
    res.setHeader('Content-Type', 'application/json');
    if (err) {
      res.send('{ "error": "Database update failed: ' + err + '"}')
    }
    else {
      res.send(req.body.json);
    }
  });
});

/* serve the index.html and the .js files */
app.use("/timekpr", express.static(__dirname));

/* user port: 8000 */
app.listen(8000);

