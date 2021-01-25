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

function getProfile() {
    axios({
        method: 'get',
        url: url + "/profile",
        credentials: 'include',
    })
        .then((response) => {
            document.getElementById("tname").innerHTML = response.data.profile.name,
                document.getElementById("temail").innerHTML = response.data.profile.email,
                document.getElementById("profilePic").innerHTML = response.data.profile.profilePic
        })
        .catch(function (error) {
            console.log(error);
        });
}

function Upload() {

    var fileInput = document.getElementById("fileInput");

    console.log("fileInput: ", fileInput);
    console.log("fileInput: ", fileInput.files[0]);

    let formData = new FormData();
    // https://developer.mozilla.org/en-US/docs/Web/API/FormData/append#syntax

    formData.append("myFile", fileInput.files[0]); // file input is for browser only, use fs to read file in nodejs client
    // formData.append("myFile", blob, "myFileNameAbc"); // you can also send file in Blob form (but you really dont need to covert a File into blob since it is Actually same, Blob is just a new implementation and nothing else, and most of the time (as of january 2021) when someone function says I accept Blob it means File or Blob) see: https://stackoverflow.com/questions/33855167/convert-data-file-to-blob
    formData.append("email", sessionStorage.getItem("email")); // this is how you add some text data along with file
    formData.append("myDetails",
        JSON.stringify({
            "subject": "Science",   // this is how you send a json object along with file, you need to stringify (ofcourse you need to parse it back to JSON on server) your json Object since append method only allows either USVString or Blob(File is subclass of blob so File is also allowed)
            "year": "2021"
        })
    );
    // you may use any other library to send from-data request to server, I used axios for no specific reason, I used it just because I'm using it these days, earlier I was using npm request module but last week it get fully depricated, such a bad news.
    axios({
        method: 'post',
        url: url + "/upload",
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' }
    })
        .then(res => {
            alert("Upload");
        })
        .catch(err => {
            console.log(err);
        })

    return false; // dont get confused with return false, it is there to prevent html page to reload/default behaviour, and this have nothing to do with actual file upload process but if you remove it page will reload on submit -->
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
            console.log(response.data.data.username);
            document.getElementById('mytweet').innerHTML += `
            <div class="posts">
                <h4>${response.data.data.username}</h4>
                <p>${response.data.data.tweet}</p>
            </div>`
        })
        .catch(function (error) {
            console.log(error);
        });
    document.getElementById('tweet').value = "";
    return false;
}

function getTweet() {
    axios({
        method: 'get',
        url: url + '/tweet-get',
        credentials: 'include',
    }).then((response) => {
        let tweets = response.data;
        let html = ""
        tweets.forEach(element => {
            html += `
            <div class="posts">
            <h4>${element.username}</h4>
            <p class="noteCard">${element.tweet}</p>
            </div>
            `
        });
        document.getElementById('getAllTweet').innerHTML = html;

        let userTweet = response.data
        let userHtml = ""

        userTweet.forEach(element => {
            if (element.username == response.data.username) {
                userHtml += `
                <div class="posts">
                <h4>${element.usernmae}</h4>
                <p class="noteCard">${element.tweet}</p>
                </div>`
            }
        });
        document.getElementById("myTweet").innerHTML = userHtml;
    })
        .catch(function (error) {
            console.log(error);
        });
    return false
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
    document.getElementById("myTweet").appendChild(eachTweet);
})

function previewFile() {
    const preview = document.querySelector('img');
    const file = document.querySelector('input[type = file]').files[0];
    const reader = new FileReader();

    reader.addEventListener("load", function () {
        // Conver image file to base64
        preview.src = reader.result;
    }, false);
    if (file) {
        reader.readAsDataURL(file);
    }
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