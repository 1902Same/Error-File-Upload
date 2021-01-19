const PORT = process.env.PORT || 5000;

var express = require("express");
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var cors = require('cors');
var morgan = require('morgan');
var jwt = require('jsonwebtoken');
var path = require('path');
var http = require('http');
const favicons = require('favicons');
var socketIO = require('socket.io');

// console.log("module: ", userModel);
var { SERVER_SECRET } = require("./core/app");
var { userModel, tweetModel } = require("./dbrepo/models");
var authRoutes = require("./routes/auth");
const { createServer } = require("http");

var app = express();
var server = http.createServer(app);

app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(morgan('dev'));

app.use("/", express.static(path.resolve(path.join(__dirname, "frontend"))));
app.use("/", authRoutes);

var io = socketIO(server);

io.on("connection", (user) => {
    console.log("User Connected!")
});

app.use(function (req, res, next) {
    console.log("req.cookies: ", req.cookies);
    if (!req.cookies.jTocken) {
        res.status(401).send("include http-only credentials with every request")
        return;
    }
    jwt.verify(req.cookies.jTocken, SERVER_SECRET, function (err, decodeData) {
        if (!err) {
            const issueDate = decodeData.iat * 1000;
            const nowDate = new Date().getTime();
            const diff = nowDate - issueDate; //86400,000

            if (diff > 300000) {//// expire after 5 min (in milis)
                res.status(401).send("Tocken Expired")
            }
            else { //issue new tocken
                var tocken = jwt.sign({
                    id: decodeData.id,
                    name: decodeData.name,
                    email: decodeData.email,
                }, SERVER_SECRET)
                res.cookie('jTocken', tocken, {
                    maxAge: 86_400_000,
                    httpOnly: true
                });
                req.body.jTocken = decodeData
                next();
            }
        }
        else {
            res.status(401).send("invalid token")
        }
    });
});

app.get("/profile", (req, res, next) => {
    console.log(req.body);

    userModel.findById(req.body.jTocken.id, 'name email phone gender createdOn',
        function (err, doc) {
            if (!err) {
                res.send({
                    profile: doc
                });
            }
            else {
                res.send({
                    message: "Server error",
                    status: 500
                });
            }
        });
});

app.post("/tweet", (req, res, next) => {
    if (!req.body.jTocken.id || !req.body.tweet) {
        res.send({
            status: 401,
            message: "Please write tweet"
        })
    }
    userModel.findById(req.body.jTocken.id, function (err, user) {
        if (!err) {
            tweetModel.create({
                "username": user.name,
                "tweet": req.body.tweet
            }, function (err, data) {
                if (err) {
                    res.send({
                        message: "Tweet DB Error",
                        status: 404
                    });
                }
                else if (data) {
                    console.log("Data check twitter : ", data);
                    res.send({
                        message: "Your tweet send",
                        status: 200,
                        tweet: data
                    });
                    io.emit("NEW_POST", data);
                    console.log("Server checking code tweet : ", data.tweet)
                }
                else {
                    res.send({
                        message: "Tweet posting error",
                        status: 500
                    });
                }
            });
        }
        else {
            res.send({
                message: "User not found",
                status: 404
            });
        }
    });
});

app.get("/tweet-get", (req, res, next) => {
    tweetModel.find({}, function (err, data) {
        if (err) {
            res.send({
                message: "Error : " + err,
                status: 404
            })
        }
        else if (data) {
            res.send({
                gettweet: data,
                status: 200
            });
        }
        else {
            res.send({
                message: "User not found"
            });
        }
    });
});

app.get("/myTweets", (req, res, next) => {
    console.log(req.body.jTocken.name);

    tweetModel.find({ username: req.body.jTocken.name }, (err, data) => {
        if (!err) {
            console.log("Tweet Data : ", data);
            res.send({
                tweet: data,
                status: 200
            });
            io.emit("MY_POST", data);
        }
        else {
            console.log("Error : ", err);
            res.send({
                message: "Error",
                status: 500
            });
        }
    });
});

server.listen(PORT, () => {
    console.log("server is running on: ", PORT);
});