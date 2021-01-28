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
var serviceAccount = {
    "type": "service_account",
    "project_id": "fir-bucket-7fb5f",
    "private_key_id": "2320f99345971f99d887e328ce8b502f93737925",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCqDMMik/24HAEW\nXuXhR0MyQFJ9KSGno+kCA1eub9nkvx5LHqmVWMez0++OCVHdqfiSXdli93/BMpt0\nCnDHWy+ha/yoEBgdA2AKe63E1U4H4CxyeC06PI+ODio/qVSf8dB/bYpw2ZUCTvFu\nk8Bb/VdzfFu/l/ZL0PnJcRP1EEWWB797cuQilxdWlzW7BOuNocBUtlc9e999vvxU\nN6WCY5d3EI+HpqA8f/9LYxm09u2OMh1U6WSvNZk6gNMnKzJj0v8HUzAc4SvTNbbx\n74pp/ObCCGcPNVFLR0aKnpLixV9wJe3ZtzOzKeOibzjDBq+VHbh/JVF7S3tfqga4\nrSjYgsv7AgMBAAECggEABimylBkR9m9euLgAE9M4g7niDh2EqzsyXCYmh4YP5bg+\nzvvRqz3NoF5QzcXXsjVmnVi1DV7+lyVljeXnosn9ZsJvpIr6HL8SZtQxqYhjghSP\n99Fpg4qjV0N7KNXTC9LrOrBhIT2O0XJupz0dQ8Lhkv1m+SwhkIDb31RE+WTkE2UD\nCKlenqZtkwtKPxzMhAyoeVk6EYszppmA1H+DMDQmHdumeBvPp/g4bxAW+w5egiPe\nzzUVLgBXrcDonYWsWgTA4/EENs2uH87aU4HiL50PO1dfoGxUN8s0lPLaRMjoshba\ntBC+6bOpbu0HkTaBjjmM2ClPHySIn+85gmGoQaQDgQKBgQDSQwAhoIdNaelNnype\nuR8tikIzC3WGqIsheuVzhaL4YEnGbVWUh9QHPg+kYe0JW4NKdjEyyeGxe1+TA92j\nZHv9WgzGDr1zWX2Zn8ESAHCt6hbCXSwrLNjeoQ/YmdsFRSgZ/jkGi9EUtKj96GUg\nT+UisuKSOwAeH/NdIUhfCkFVgQKBgQDPCnQqpCbLQcB3vRvHv9CtRL8c1kqNTt8p\n8VZliaQUHxU3LJLIONNfp2E2uSkD9OtCRa5KiGrX6QeYOJzYhRqWLeejpe0C2KRA\nD1Dwkkx8V/o7wXim7Ej3EOetn6SMLc5xn3IkoGny9FXHNr2k0eIL+dYAJBxTFbsR\n0rEVQcA3ewKBgAeq9dhEGGsUT7PK+CqYKbDpd9yQsGqGvvwrlS6PUxAnwsj/t71A\n7tSMyNk/0PskYTdX9BdcEWT9kNC1tWF+Cp+Epy6Z3wLT4qa1kr7rUTCmdsoDx9aT\nPh1wVjmZ8sjQatP313CLrMZKiFcqIHX7M+n+CBE5IZn3pFJjIlaE8zkBAoGBALqU\nPSPAUoWRd5Vwgnx8S94ZufCO3RiDH3F439cZNxg6+q+CJ7TwIOxutpjOPDwol2pd\nyTe5wC9a/VEck5w8Nz1nmPxNJ04NVde09cgWz36u+f6n18b14LtmLKK2317EWOrk\nOcTwGwqrTjH9DuJdkkwglc4CvNPTHYZuTM9PNZ3JAoGAVKZeGNkSHY35YCBxO7n3\nbBNSzyp0I+wkXdHdXaLPqFAMR6bB1Srx0p/dXnwZh68M0u5WTvwpcK2XPbgrhjCN\nE7bzxTxuZpCVc3ITA3DGFmX4KFj9Uug31nF8jH45Fstj4+9JE7PLNJfRiPzwVLXW\nNQtqfgA1IOAo7BEYS/lC3TY=\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-ww8z7@fir-bucket-7fb5f.iam.gserviceaccount.com",
    "client_id": "115366439510247935453",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-ww8z7%40fir-bucket-7fb5f.iam.gserviceaccount.com"
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://fir-bucket-7fb5f-default-rtdb.firebaseio.com/",
});
const bucket = admin.storage().bucket("gs://fir-bucket-7fb5f.appspot.com"); // Firebase bucket Link
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
                res.send({
                    message: "Tocken Expired",
                    status: 401
                })
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
                message: "Invalid token",
                status: 401
            })
        }
    });
});

app.get("/profile", (req, res, next) => {
    console.log(req.body);

    userModel.findById(req.body.jTocken.id, 'name email phone gender createdOn profilePic',
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
    userModel.findById(req.body.jTocken.id, 'name', function (err, user) {
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
                    res.send({
                        message: "Your tweet send",
                        status: 200,
                        data: data
                    });
                    io.emit("NEW_POST", data);
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
app.post("/upload", upload.any(), (req, res, next) => {  // never use upload.single. see https://github.com/expressjs/multer/issues/799#issuecomment-586526877

    console.log("req.body: ", req.body);
    console.log("req.body: ", JSON.parse(req.body.myDetails));
    console.log("req.files: ", req.files);

    console.log("uploaded file name: ", req.files[0].originalname);
    console.log("file type: ", req.files[0].mimetype);
    console.log("file name in server folders: ", req.files[0].filename);
    console.log("file path in server folders: ", req.files[0].path);

    // upload file to storage bucket 
    // you must need to upload file in a storage bucket or somewhere safe
    // server folder is not safe, since most of the time when you deploy your server
    // on cloud it makes more t2han one instances, if you use server folder to save files
    // two things will happen, 
    // 1) your server will no more stateless
    // 2) providers like heroku delete all files when dyno restarts (their could be lots of reasons for your dyno to restart, or it could restart for no reason so be careful) 


    // https://googleapis.dev/nodejs/storage/latest/Bucket.html#upload-examples
    bucket.upload(
        req.files[0].path,
        // {
        //     destination: `${new Date().getTime()}-new-image.png`, // give destination name if you want to give a certain name to file in bucket, include date to make name unique otherwise it will replace previous file with the same name
        // },
        function (err, file, apiResponse) {
            if (!err) {
                // console.log("api  sameer khan resp: ", apiResponse);

                // https://googleapis.dev/nodejs/storage/latest/Bucket.html#getSignedUrl
                file.getSignedUrl({
                    action: 'read',
                    expires: '03-09-2491'
                }).then((urlData, err) => {
                    if (!err) {
                        console.log("public downloadable url: ", urlData[0]) // this is public downloadable url 
                        // res.send(urlData[0]);
                        userModel.findOne({ email: req.body.email }, (err, user) => {
                            if (!err) {
                                user.updateOne({ profilePic: urlData[0] }, {}, function (err, data) {
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


                        // // delete file from folder before sending response back to client (optional but recommended)
                        // // optional because it is gonna delete automatically sooner or later
                        // // recommended because you may run out of space if you dont do so, and if your files are sensitive it is simply not safe in server folder
                        try {
                            fs.unlinkSync(req.files[0].path)
                            //file removed
                            return;
                        } catch (err) {
                            console.error(err)
                        }
                        // res.send("Ok");/
                    }
                })
            } else {
                console.log("err: ", err)
                res.status(500).send();
            }
        });
})
// app.post("/upload", upload.any(), (req, res, next) => {
//     // console.log("ya upload ka jtoken han :", req.body.jTocken);
//     console.log("req.body : ", req.body);
//     console.log("req.bdoy : ", JSON.parse(req.body.myDetails));
//     console.log("req.files : ", req.files);

//     console.log("Upload file name: ", req.files[0].originalname);
//     console.log("File type : ", req.files[0].mimetype);
//     console.log("File name in server folder : ", req.files[0].filename);
//     console.log("File path in server folder : ", req.files[0].path);

//     // https://googleapis.dev/nodejs/storage/latest/Bucket.html#upload-examples
//     bucket.upload(
//         req.files[0].path,
//         // {
//         //     destination: `${new Date().getTime()}-new-image.png`, // give destination name if you want to give a certain name to file in bucket, include date to make name unique otherwise it will replace previous file with the same name
//         // },
//         function (err, file, apiResponse) {
//             if (!err) {
//                 // console.log("api resp: ", apiResponse);
//                 // https://googleapis.dev/nodejs/storage/latest/Bucket.html#getSignedUrl
//                 file.getSignedUrl({
//                     action: 'read',
//                     expires: '03-09-2491'
//                 })
//                     .then((urlData, err) => {
//                         if (!err) {
//                             console.log("Public downloadable url : ", urlData[0]); // this is public downloadable url 
//                             userModel.findOne(req.body.jTocken, 'email', function (err, user) {
//                                 if (!err) {
//                                     user.update({ profilePic: urlData[0]}, {}, function (err, data) {
//                                         res.send({
//                                             pic: user.profilePic
//                                         });
//                                     });
//                                 }
//                                 else {
//                                     res.send({
//                                         message: "error"
//                                     });
//                                 }
//                             })
//                             try {
//                                 fs.unlinkSync(req.files[0].path)
//                                 //file removed
//                             } catch (err) {
//                                 console.error(err)
//                             }
//                             // res.send({
//                             //     message: "OK Done!",
//                             //     file: urlData[0]
//                             // });
//                         }
//                     }).catch(err => {
//                         console.log("Err", err);
//                     })

//             }
//             else {
//                 console.log("Error : ", err);
//                 res.send({
//                     status: 500
//                 });
//             }
//         });
// });

server.listen(PORT, () => {
    console.log("server is running on: ", PORT);
});