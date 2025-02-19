const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected successfully!');
  mongoose.connection.close();
})
.catch(err => {
  console.error('Connection error:', err);
});