var express = require('express');
var httpsRequest = require('request');
const imageDownloader = require('image-downloader');
const fs = require('fs');

// Load the Express package and create our app
var app = express();

const apiHost = "https://reqres.in/api/users/";
var images = {};

process.on('SIGINT', function() {

  console.log('Stopping server');
  process.exit();
});
 
app.use(function(req, res, next){
  res.setTimeout(1000000, function(){
    console.log('Request has timed out.');
    res.sendStatus(408);
    res.timeouted = true;
  });

  next();
});

function apiGetUserInfo(userId, callback) {

  httpsRequest({
    url: apiHost + userId,
    method: "GET",
    json: true
  }, function (error, response, body) {

    if(error) {
      console.error(error);
      callback("error", error);
      return;
    }

    if(!response) {
      callback("error", "{}");
      return;
    }

    if(response.statusCode != 200) {
      callback("status", { statusCode : response.statusCode, body: body });
      return;
    }

    callback("ok", {body: body});
    return;
  });
}

app.get('/api/user/:id', function(req, res, next) {

  var userId = req.params.id;
  console.log('User id = ' + userId);

  apiGetUserInfo(userId, function(result, value) {

    if(result == 'error') {
      console.error(value);
      res.statusCode = 400;
      res.send(value);
      return;
    }

    if(result == 'status') {
      res.statusCode = value.statusCode;
      res.send(value.body);
      return;
    }

    if(result == 'ok') {
      res.statusCode = 200;
      res.send(value.body);
      return;
    }

    res.statusCode = 400;
    res.send({});
    return;
  });
});

app.get('/api/user/:id/avatar', function(req, res, next) {

  var userId = req.params.id;
  console.log('User id = ' + userId);

  apiGetUserInfo(userId, function(result, value) {

    if(result == 'error') {
      console.error(value);
      res.statusCode = 400;
      res.send(value);
      return;
    }

    if(result == 'status') {
      res.statusCode = value.statusCode;
      res.send(value.body);
      return;
    }

    if(result == 'ok') {

      if(!value.body) {
        res.statusCode = 400;
        res.send("Bad user info");
        return;
      }

      if(!value.body.data) {
        res.statusCode = 400;
        res.send("Bad user info");
        return;
      }

      if(!value.body.data.avatar) {
        res.statusCode = 400;
        res.send("No avatar present");
        return;
      }
      
      //download avatar
      var avatar = value.body.data.avatar;

      if(images[avatar]) {

        var image64 = images[avatar].image;
        res.statusCode = 200;
        res.send({ avatar: image64 });
        return;
      }

      // Download to a directory and save with the original filename
      const options = {
        url: avatar,
        dest: './downloads/' + Date.now().toString() + '.bin'
      }

      imageDownloader.image(options).then(({ filename, image }) => {
        console.log('File saved to', filename);
        var image64 = image.toString('base64');

        images[avatar] = {};
        images[avatar].image = image64;
        images[avatar].filename = filename;

        res.statusCode = 200;
        res.send({ avatar: image64 });
        return;
      })
      .catch((err) => {
        console.error(err);
      })

      return;
    }

    res.statusCode = 400;
    res.send({});
    return;
  });
});

app.delete('/api/user/:id/avatar', function(req, res, next) {

  var userId = req.params.id;
  console.log('User id = ' + userId);

  apiGetUserInfo(userId, function(result, value) {

    if(result == 'error') {
      console.error(value);
      res.statusCode = 400;
      res.send(value);
      return;
    }

    if(result == 'status') {
      res.statusCode = value.statusCode;
      res.send(value.body);
      return;
    }

    if(result == 'ok') {

      if(!value.body) {
        res.statusCode = 400;
        res.send("Bad user info");
        return;
      }

      if(!value.body.data) {
        res.statusCode = 400;
        res.send("Bad user info");
        return;
      }

      if(!value.body.data.avatar) {
        res.statusCode = 400;
        res.send("No avatar present");
        return;
      }

      var avatar = value.body.data.avatar;

      if(!images[avatar]) {

        res.statusCode = 400;
        res.send({ });
        return;
      }

      fs.unlinkSync(images[avatar].filename);
      images[avatar] = undefined;
      res.statusCode = 200;
      res.send({ });
      return;
    }

    res.statusCode = 400;
    res.send({});
    return;
  });
});

// start the server
app.listen(3000);

// log what just happened
console.log('Server started. Open http://localhost:3000');