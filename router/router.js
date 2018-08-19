
var express = require('express');
var router = express.Router();
var fs = require('fs');
var csv = require('fast-csv');
var allCsvs = require('./allCsvs.js');
var mongoose = require('mongoose');
var db = require('../models');

// WATSON CONFIGURATION:
var PersonalityInsightsV3 = require('watson-developer-cloud/personality-insights/v3');

var personalityInsights = new PersonalityInsightsV3({
  version: '2018-08-17',
  username: '1c3f10b8-21d8-423c-ab57-1073a84c6c35',
  password: 'Y74Yp5lGFdlO',
  url: 'https://gateway.watsonplatform.net/personality-insights/api'
});

// ========================================================================================================================

// This seems to work -- takes about 15 minutes -- not sure whether because of fast-csv streaming or Mongo, but MUCH easier than with Postgres:
function generateDB() {
  allCsvs.forEach(file => {
    var stream = fs.createReadStream(`csvs/${file}.csv`);

    // Create the play document:
    db.Play.create({ title: file })
    .then(data => console.log(data))
    .catch(err => console.log(err.message));

    var csvStream = csv()
    // This fires for every row in the csv:
    .on("data", function(data){
      // Create the Line document:
      db.Line.create({
        speaker: data[3],
        text: data[2],
        line_no: data[1]
      })
      .then(line => {
        // Update the relevant Play document:
        return db.Play.findOneAndUpdate({ title: file }, { $push: { lines: line._id } }, { new: true });
      })
      .then(play => {
        console.log(play);
      })
      .catch(err => {
        console.log(err.message);
      });
    })
    .on("end", function(){
      console.log("done");
    });

    stream.pipe(csvStream);
  });
}

// generateDB();

// ========================================================================================================================

router.get('/speaker/:name', (req, res) => {
  db.Line.find({"speaker":  req.params.name})
  .then(data => {
    console.log(data);
    linesToChunksBySpeaker(data);
    res.json(data);
  })
  .catch(err => {
    console.log(err);
  });
});

function linesToChunksBySpeaker(arr) {
  let res = [];

  return res;
}


router.post('/word', function(req, res) {
  // I imagine we have to query the Plays collection if we want info about the title of the play:
  db.Line.find({"text": {$regex: `.*${req.body.word}.*`}})
  .then(data => {
    res.json(data);
  })
  // db.Play.find({}, {"lines": 1})
  // // .populate("lines")
  // .then(data => {
  //   res.json(data);
  // })
  .catch(err => res.json(err));

  // This seems to be solved -- at least in the database, the plays have Lines:

  // Can't quite figure out how to grab all lines from the Plays collection... Would be easier to just add a 'play' field to lines collection...But we should learn this way.
  // I think what we need to do is populate!
  // Hmm, but in order to that we need to recreate the DB with the reference to Plays saved in the Lines... Already, with the first relationship, it becomes annoying.

});


module.exports = router;
