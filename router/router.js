
var express = require('express');
var router = express.Router();
var fs = require('fs');
var csv = require('fast-csv');
var allCsvs = require('./allCsvs.js');

var mongoose = require('mongoose');

var db = require('../models');

// ========================================================================================================================

// This seems to work -- takes about 15 minutes:
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


// Every time the word "deliver" is used by Shakespeare:
// db.Line.find({"text": {$regex: ".*deliver.*"}})
//   .then(res => console.log(res))
//   .catch(err => console.log(err));

  db.Line.find({"speaker": "HERMIONE"})
    .then(res => console.log(res))
    .catch(err => console.log(err));





module.exports = router;
