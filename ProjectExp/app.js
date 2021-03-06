const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const expressMessage = require('express-messages')
const passport = require('passport');
const config = require('./config/database');
// mongoose.connect('mongodb://localhost:27017/nodek', { useNewUrlParser: true, useUnifiedTopology: true,});
const PORT = process.env.PORT || 8080;

mongoose.connect(config.database);
let db = mongoose.connection;

db.once('open', () => {
    console.log('Connected to Mongo DB');
})

db.on('error', (err) => {
    console.log(err);
})

const app = express();

let Article = require('./models/article');

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug');

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}));

app.use(flash());
app.use(function (req, res, next) {
    res.locals.messages = expressMessage(req, res);
    next();
});

app.use(expressValidator({
    errorFormatter: function (param, msg, value) {
        var namespace = param.split('.'),
            root = namespace.shift(),
            formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param: formParam,
            msg: msg,
            value: value
        };
    }
}));

// Passport Config
require('./config/passport')(passport);
// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*', function (req, res, next) {
    res.locals.user = req.user || null;
    next();
});

app.get("/", ensureAuthenticated, (req, res) => {
    Article.find({}, (err, articles) => {
        if (err) {
            console.log(err);
        } else {
            res.render("index", {
                title: 'Hello',
                articles: articles,
            });
        }
    })
})

// Access Control
function ensureAuthenticated(req, res, next){
    if(req.isAuthenticated()){
      return next();
    } else {
      req.flash('danger', 'Please login');
      res.redirect('/users/login');
    }
  }

let articles = require('./routes/articles.js');
let users = require('./routes/users');
app.use('/articles', articles);
app.use('/users', users);

app.listen(PORT, () => {
    console.log(`Server starting at ${PORT}`);
});