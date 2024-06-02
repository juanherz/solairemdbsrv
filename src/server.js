const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());

const mongoUri = "mongodb+srv://solaire:solaire1@cluster0.syokry5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
if (!mongoUri) {
  throw new Error(
    `MongoURI was not supplied.`
  );
}

mongoose.set("strictQuery", true);
// resolves future deprecation issue with Mongoose v7

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const authRoutes = require("./routes/auth");
app.use('/api/account',authRoutes);

app.listen(5000, () => {
  console.log("Listening on port 5000");
});
