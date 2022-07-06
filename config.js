require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.HOST, {
    useNewUrlParser : true,
    useUnifiedTopology : true,
    useFindAndModify: false,
    useCreateIndex: true,
  });
  
  mongoose.connection
    .once("open", () => console.log("DB Connected..."))
    .on("error", (error) => {
      console.log("Error While Connecting With DB");
    });
  
  module.exports = { mongoose };