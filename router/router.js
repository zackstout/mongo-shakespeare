
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

router.get('/personality', (req, res) => {
  var stream = fs.createReadStream(`OTHELLO.csv`);
  var stream2 = fs.createReadStream(`IAGO.csv`);

  var result = []; // First row is headings, second row is values
  var result2 = [];

  var csvStream = csv()
  // This fires for every row in the csv:
  .on("data", function(data){
    // console.log("DATA BE", data);
    result.push(data);
  })
  .on("end", function(){
    console.log("done");
    // console.log(result);
    var csvStream2 = csv()
    // This fires for every row in the csv:
    .on("data", function(data){
      // console.log("DATA BE", data);
      result2.push(data);
    })
    .on("end", function(){
      console.log("donedone");
      res.json({
        "OTHELLO": result,
        "IAGO": result2
      });
      // console.log(result2);
    });
    stream2.pipe(csvStream2);

  });



  stream.pipe(csvStream);

});



router.get('/speaker/:name', (req, res) => {
  db.Line.find({"speaker":  req.params.name})
  .then(data => {
    // console.log(data);
    const chunks = linesToChunksBySpeaker(data);
    // console.log(chunks);
    const j_chunks = chunks.map(c => {
      return {
        "content": c,
        "contenttype": "text/plain",
        "language": "en",
        "id": Math.floor(Math.random() * 1000000000000).toString(),
      };
    });

    // const json_chunks = JSON.parse(j_chunks);
    // console.log(j_chunks);

    var profileParams = {
      // Get the content from the JSON file.
      content: { "contentItems": j_chunks },
      'content_type': 'application/json',
      'consumption_preferences': true,
      'raw_scores': true,
      'csv_headers': true // Ahh also need this for the csv!

    };

    // personalityInsights.profile(profileParams, function(error, profile) {
    //   if (error) {
    //     console.log(error);
    //   } else {
    //     console.log(JSON.stringify(profile, null, 2));
    //   }
    // });

    personalityInsights.profileAsCsv(profileParams, function(error, profile) {
      if (error) {
        console.log(error);
      } else {
        var wstream = fs.createWriteStream(`${req.params.name}.csv`);
        wstream.write(profile);
        wstream.end();
      }
    });

    res.json(j_chunks);
  })
  .catch(err => {
    console.log(err);
  });
});

function getNextLine(line_no) {
  const act = line_no.slice(0, 1);
  const scene = line_no.slice(1+1, 3);
  const line = line_no.slice(3+1);
  const next_line_no = `${act}.${scene}.${parseInt(line) + 1}`;
  return next_line_no;
}

function linesToChunksBySpeaker(arr) {
  let res = [];
  let chunk = arr[0].text;

  let next_line_no = getNextLine(arr[0].line_no);

  for (let i=1; i < arr.length; i++) {
    const line_no = arr[i].line_no;
    // console.log(line_no, next_line_no);
    if (line_no == next_line_no) {
      chunk += ' ' + arr[i].text;

    } else {
      res.push(chunk);
      chunk = arr[i].text;
    }

    next_line_no = getNextLine(line_no);
  }
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
