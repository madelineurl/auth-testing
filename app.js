const express = require('express');
const morgan = require('morgan');
const app = express();
app.use(express.json());
const { models: { User }} = require('./db');
const path = require('path');

app.use(morgan('dev'));

app.get('/', (req, res)=> res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async(req, res, next)=> {
  try {
    const token = await User.authenticate(req.body);
    res.send({ token });
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/auth', async(req, res, next)=> {
  try {
    res.send(await User.byToken(req.headers.authorization));
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/users/:id/notes', async(req, res, next)=> {
  try {
    const user = await User.byToken(req.headers.authorization);
    if (user) {
      const notes = await user.getNotes();
      if (notes) res.send(notes);
    }
  }
  catch(ex){
    next(ex);
  }
});

app.use((err, req, res, next)=> {
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
