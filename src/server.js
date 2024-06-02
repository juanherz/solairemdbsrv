require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());

const mongoUri = `${process.env.MONGODB_CONNECT_URI}`;
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
  console.log(`Listening on port ${process.env.PORT || 5000}`);
});
