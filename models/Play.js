
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var PlaySchema = new Schema({
  title: String,
  lines: [
  {
    type: Schema.Types.ObjectId,
    ref: "Line"
  }
]
});

// This creates our model from the above schema, using mongoose's model method
module.exports = mongoose.model("Play", PlaySchema);
