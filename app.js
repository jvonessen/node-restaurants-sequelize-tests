const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');

const restaurantsRouter = require('./routes/restaurants');
const gradesRouter = require('./routes/grades');


// Set up the express app
const app = express();

app.use(morgan('common'));
app.use(bodyParser.json());

app.use('/restaurants', restaurantsRouter);
app.use('/grades', gradesRouter);

app.use('*', function(req, res) {
  res.status(404).json({message: 'Not Found'});
});

module.exports = app;
