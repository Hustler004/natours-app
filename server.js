const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('UNHANDLED EXCEPTION...Shutting down');
  console.log(err.name, err.message);
  //exiting directly is a very abrupt way of closing the app so we first call server.close() function then in the callback function we can include process.exit()

  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

//reading of variable only happens once and so then it can be used wherever we want just like we did in app.js to check if the env is in development mode
// console.log(process.env);
mongoose
  .connect(DB, {
    // useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: false,
    // useUnifiedTopology: true,
  })
  .then(() => console.log('DB connection successful!'))
  .catch((err) => console.log('ERROR'));
//above three are some of the settings that can be used while creating my own application
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
module.exports = app;
//event listener for handling all the unhandled rejected promises
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION...Shutting down');
  console.log(err.name, err.message);
  //exiting directly is a very abrupt way of closing the app so we first call server.close() function then in the callback function we can include process.exit()
  server.close(() => {
    process.exit(1);
  });
});
