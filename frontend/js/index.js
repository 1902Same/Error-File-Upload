const url = "http://localhost:5000";
var socket = io(url);


socket.on('connect', function () {
    console.log("connected")
});

function Signup() {
    axios({
        method: 'post',
        url: url + "/signup",
        data: {
            name: document.getElementById("sname").value,
            email: document.getElementById("semail").value,
            password: document.getElementById("spassword").value,
            number: document.getElementById("snumber").value,
            gender: document.getElementById("sgender").value,
        }
    })
        .then(function (response) {
            if (response.data.status === 200) {
                alert(response.data.message);
                window.location.href = "login.html"
            }
            else {
                alert(response.data.message);
            }
        })
        .catch(function (error) {
            console.log(error);
        });
    return false;
}

function Login() {
    axios({
        method: 'post',
        url: url + "/login",
        data: {
            email: document.getElementById("lemail").value,
            password: document.getElementById("lpassword").value
        }, withCredentials: true
    })
        .then((response) => {
            if (response.data.status === 200) {
                alert(response.data.message);
                window.location.href = "tweet.html"
            }
            else {
                alert(response.data.message);
            }
        })
        .catch(function (error) {
            console.log(error);
        });
    return false;
}

function Profile() {
    axios({
        method: 'get',
        url: url + "/profile"
    })
        .then((response) => {
            document.getElementById("pname").innerHTML = response.data.profile.name,
                document.getElementById("pemail").innerHTML = response.data.profile.email,
                document.getElementById("pphone").innerHTML = response.data.profile.phone,
                document.getElementById("pgender").innerHTML = response.data.profile.gender
        });
    return false;
}

function ForgotOne() {
    axios({
        method: 'post',
        url: url + "/forgot-password",
        data: {
            email: document.getElementById("f1email").value
        }, withCredentials: true
    })
        .then((response) => {
            if (response.data.status === 200) {
                alert(response.data.message);
                window.location.href = "forgottwo.html"
            }
            else {
                alert(response.data.message);
            }
        })
        .catch(function (error) {
            console.log(error);
        });
    return false;
}

function ForgotTwo() {
    axios({
        method: 'post',
        url: url + "/forgot-password-step2",
        data: {
            email: document.getElementById("f2email").value,
            otp: document.getElementById("f2otp").value,
            newPassword: document.getElementById("f2password").value
        }, withCredentials: true
    })
        .then((response) => {
            if (response.data.status === 200) {
                alert(response.data.message);
                window.location.href = "login.html"
            }
            else {
                alert(response.data.message);
            }
        })
        .catch(function (error) {
            console.log(error);
        });
    return false;
}

function tweetPost() {
    axios({
        method: 'post',
        url: url + "/tweet",
        data: {
            tweet: document.getElementById("tweet").value
        }
    })
        .then((response) => {
            if (response.data.status === 200) {
                alert(response.data.message);
            }
            else {
                alert(response.data.message);
            }
        })
        .catch(function (error) {
            console.log(error);
        });
}

function getTweet() {
    getProfile();
    axios({
        method: 'get',
        url: url + "/tweet-get",
        credentials: 'include'
    })
        .then((response) => {
            let tweet = response.data.gettweet;
            for (i = 0; i < tweet.length; i++) {
                var eachTweet = document.createElement("li");
                eachTweet.innerHTML = `
                <h4>
                    ${tweet[i].username}
                </h4>
                <p>
                    ${tweet[i].tweet}
                </p>`
                document.getElementById("myTweet").appendChild(eachTweet);
            }
        })
        .catch(function (error) {
            console.log(error);
        });
}

function myTweet() {
    axios({
        method: 'get',
        url: url + "/myTweets",
        credentials: 'include'
    })
        .then((response) => {
            let tweets = response.data.tweet;
            for (i = 0; i < tweets.length; i++) {
                var eachtweet = document.createElement("li");
                eachtweet.innerHTML = `
                <h4>
                    ${tweets[i].username}
                </h4>
                 <p>
                    ${tweets[i].tweet}
                </p>`;
                document.getElementById("getAllTweet").appendChild(eachtweet);
            }
        })
        .catch(function (error) {
            console.log(error);
        });
}

socket.on("NEW_POST", (newPost) => {
    console.log("New Post : ", newPost);
    let jsonRes = newPost;
    var eachTweet = document.createElement("li");
    eachTweet.innerHTML = `
    <h4>
        ${jsonRes.username}
    </h4>
    <p>
        ${jsonRes.tweet}
    </p>`
    document.getElementById("getAllTweet").appendChild(eachTweet);
})

socket.on("MY_POST", (newPost) => {
    console.log("My Post : ", newPost);
    let jsonRes = newPost;
    var eachTweet = document.createElement("li");
    eachTweet.innerHTML = `
    <h4>
        ${jsonRes.username}
    </h4>
    <p>
        ${jsonRes.tweet}
    </p>`
    document.getElementById("getAllTweet").appendChild(eachTweet);

})

function getProfile() {
    axios({
        method: 'get',
        url: url + "/profile"
    })
        .then((response) => {
            document.getElementById("tname").innerHTML = response.data.profile.name,
                document.getElementById("temail").innerHTML = response.data.profile.email
        });
}

function Logout() {
    axios({
        method: 'post',
        url: url + "/logout"
    })
        .then((response) => {
            if (response.data.status === 200) {
                alert(response.data.message);
                window.location.href = "login.html"
            }
        })
        .catch(function (err) {
            console.log(err);
        })
}