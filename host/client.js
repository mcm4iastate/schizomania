var socket = io();

var roomcode;

meSpeak.loadConfig("mespeak_config.json");
meSpeak.loadVoice("voices/en/en-us.json");

const options = {
    amplitude: 100,  // Volume (0-200)
    pitch: 10,       // Pitch (0-99)
    speed: 40,      // Speed (words per minute)
    wordgap: 20,      // Gap between words (in 10ms units)
    variant: "m2"    // Voice variant (e.g., female voice)
};

socket.emit("host", null);

if (!roomcode) {
    socket.emit("get-code");
}

socket.on("room-code-assignment", (code) => {
    roomcode = code;
    document.getElementById("code").innerText = "" + code;
});

socket.on("start-success", () => {
    document.getElementById("pregame-button").style.display = "none";
    document.getElementById("pregame").style.display = "none";
    document.getElementById("game").style.display = "block";
}) 

socket.on("update-players", (playerslist) => {

    document.getElementById("players-label").style.display = "block";

    var left = document.getElementById("players-left");
    var right = document.getElementById("players-right");

    left.innerHTML = "";
    right.innerHTML = "";

    var l = true;
    for (var i = 0; i < playerslist.length; i++) {

        var temp = document.createElement("p");
        temp.style.margin = "2px";

        if (l) {
            temp.innerText = playerslist[i];
            left.appendChild(temp);
        } else {
            temp.innerText = playerslist[i];
            right.appendChild(temp);
        }

        l = !l;
    }
});

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("pregame-button").addEventListener("click", () => socket.emit("start"));
});

socket.on("game-over", (compositions, prompts) => {

    document.getElementById("pregame").style.display = "none";
    document.getElementById("pregame-button").style.display = "none";
    document.getElementById("game").style.display = "none";
    document.getElementById("post-game").style.display = "block";

    endgame(compositions, prompts);
});

var i = 0;

function endgame(compositions, prompts) {
    if (Array.isArray(compositions) && compositions.length > 0 && Array.isArray(prompts) && prompts.length > 0) {
        i = 0;
        console.log(prompts);
        playNext(compositions, prompts);
    } else {
        console.error("Invalid compositions array:", compositions);
    }
}
async function playNext(compositions, prompts) {

    if (!(Array.isArray(compositions) && compositions.length > 0 && Array.isArray(prompts) && prompts.length > 0)) {
        return;
    }

    if (i < compositions.length) {

        document.getElementById("current-prompt").innerText = prompts[i];
        document.getElementById("current-comp").innerText = compositions[i];
        
        // with random voice
        await meSpeak.speak(prompts[i] + "\n" + compositions[i] + "\n\n", {amplitude: 100, pitch: ((Math.random() * 50) + 20), speed: ((Math.random() * 20) + 120), wordgap: 3, variant: ("" + (Math.random() < 0.5 ? 'm' : 'f') + (Math.floor(Math.random() * 4) + 1)), callback: () => playNext(compositions, prompts)});
        
        i++;
    } else {
        //console.log("All compositions played.");
    }
}

socket.on("update", (timer, round, roundnum, inbetween) => {
    document.getElementById("round").innerText = "Round " + round + "/" + roundnum;
    document.getElementById("write-timer").innerText = timer;
    document.getElementById("break-countdown").innerText = timer;

    if (inbetween) {
        document.getElementById("ready-div").style.display = "none";
        document.getElementById("write-timer").style.display = "block";
        document.getElementById("round").style.display = "block";
    } else {
        document.getElementById("ready-div").style.display = "block";
        document.getElementById("write-timer").style.display = "none";
        document.getElementById("round").style.display = "none";
    }
});

const speed = 3;

function moveCircle(circle) {
    let left = parseInt(circle.style.left) || 0;
    let top = parseInt(circle.style.top) || 0;

    let x = (Math.random() * speed*2 + 0.5) - speed;
    let y = (Math.random() * speed*2 + 0.5) - speed;

    // Ensure the circle stays within the window boundaries
    left = Math.min(Math.max(left + x, 0), window.innerWidth - circle.offsetWidth);
    top = Math.min(Math.max(top + y, 0), window.innerHeight - circle.offsetHeight);

    circle.style.left = left + "px";
    circle.style.top = top + "px";
}

function animateCircles() {
    const circles = document.querySelectorAll('.circle');
    circles.forEach(circle => {
        moveCircle(circle);
    });
    requestAnimationFrame(animateCircles);
}

document.addEventListener('DOMContentLoaded', () => {
    const circles = document.querySelectorAll('.circle');
    circles.forEach(circle => {
        circle.style.position = 'absolute'; // Ensure circles are positioned absolutely
        circle.style.left = Math.random() * (window.innerWidth - circle.offsetWidth) + "px";
        circle.style.top = Math.random() * (window.innerHeight - circle.offsetHeight) + "px";
    });
    animateCircles();
});