if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
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

const salesRoutes = require('./routes/sales');
app.use('/api/sales', salesRoutes);

const clientsRoutes = require('./routes/clients');
app.use('/api/clients', clientsRoutes);

const productsRoutes = require('./routes/products');
app.use('/api/products', productsRoutes);

const ordersRoutes = require('./routes/orders');
app.use('/api/orders', ordersRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
