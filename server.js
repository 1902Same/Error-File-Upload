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
const fs = require("fs");

var { SERVER_SECRET } = require("./core/app");
var { userModel, tweetModel } = require("./dbrepo/models");
var authRoutes = require("./routes/auth");
// const { createServer } = require("http");

//==========================================================================================
const multer = require("multer");
const storage = multer.diskStorage({ // https://www.npmjs.com/package/multer#diskstorage
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, `${new Date().getTime()}-${file.filename}.${file.mimetype.split("/")[1]}`)
    }
});
var upload = multer({ storage: storage });

//==========================================================================================

const admin = require("firebase-admin");
// https://firebase.google.com/docs/storage/admin/start
var serviceAccount = {};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "",
});
const bucket = admin.storage().bucket(""); // Firebase bucket Link
//==========================================================================================

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
                    phone: decodeData.phone,
                    gender: decodeData.gender
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
            res.send({
                message: "invalid token",
                status: 401
            })
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
        else {
            console.log(data)
            req.body.data = data
            // data = data[data.length -1]
            res.send(data)
        }
    });
});

app.post("/upload", upload.any(), (req, res, next) => {

    console.log("req.body : ", req.body);
    console.log("req.bdoy : ", JSON.parse(req.body.myDetails));
    console.log("req.files : ", req.files);

    console.log("Upload file name: ", req.files[0].originalname);
    console.log("File type : ", req.files[0].mimetype);
    console.log("File name in server folder : ", req.files[0].filename);
    console.log("File path in server folder : ", req.files[0].path);

    // https://googleapis.dev/nodejs/storage/latest/Bucket.html#upload-examples
    bucket.upload(
        req.files[0].path,
        // {
        //     destination: `${new Date().getTime()}-new-image.png`, // give destination name if you want to give a certain name to file in bucket, include date to make name unique otherwise it will replace previous file with the same name
        // },
        function (err, file, apiResponse) {
            if (!err) {
                // console.log("api resp: ", apiResponse);

                // https://googleapis.dev/nodejs/storage/latest/Bucket.html#getSignedUrl
                file.getSignedUrl({
                    action: 'read',
                    expires: '03-09-2491'
                })
                    .then((urlData, err) => {
                        if (!err) {
                            console.log("Public downloadable url : ", urlData[0]); // this is public downloadable url 
                            userModel.findOne({ email: req.body.email }, (err, user) => {
                                console.log("Yahan dekho", user);
                                if (!err) {
                                    user.update({ profilePic: urlData[0] }, {}, function (err, data) {
                                        // console.log("Yahan dekho",user);
                                        res.send({
                                            pic: user.profilePic
                                        });
                                    })
                                }
                                else {
                                    res.send({
                                        message: "error"
                                    });
                                }
                            })
                            try {
                                fs.unlinkSync(req.files[0].path)
                                //file removed
                            } catch (err) {
                                console.error(err)
                            }
                            // res.send({
                            //     message: "OK Done!",
                            //     file: urlData[0]
                            // });
                        }
                    })
            }
            else {
                console.log("Error : ", err);
                res.send({
                    status: 500
                });
            }
        });
});

server.listen(PORT, () => {
    console.log("server is running on: ", PORT);
});