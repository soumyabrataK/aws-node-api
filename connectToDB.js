const mongoose = require('mongoose');
require('dotenv');
mongoose.Promise = global.Promise;
let isConnected;
// let uri;
// uri = process.env.DB.toString()
module.exports = connectToDB = () => {
  if (isConnected) {
    console.log('=> using existing database connection');
    return Promise.resolve();
  }

  console.log('=> using new database connection', process.env.DB);

  return mongoose.connect(process.env.DB, { useUnifiedTopology: true, useNewUrlParser: true, useNewUrlParser: true, useUnifiedTopology: true, maxPoolSize: 1, socketTimeoutMS: 2000000, keepAlive: true })
    .then(db => {
      console.log("database connect");
      isConnected = db.connections[0].readyState;
    });
};