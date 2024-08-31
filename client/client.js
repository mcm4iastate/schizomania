var socket = io();

meSpeak.loadConfig("mespeak_config.json");
meSpeak.loadVoice("voices/en/en-us.json");

let hallucinations = [
    "Destroy that document.",
    "Don’t eat that food.",
    "Turn off all the lights.",
    "You must stay awake all night.",
    "Ignore what they are saying.",
    "If you go outside, something bad will happen.",
    "They are watching you right now.",
    "You will never be safe.",
    "Everyone is plotting against you.",
    "They will hurt you if you don’t listen.",
    "They’re coming to get you.",
    "You’re in danger.",
    "They're in the walls.",
    "They’re coming to get you.",
    "You need to leave the house.",
    "Don’t trust anyone.",
    "You need to burn it down",
    "Throw away your phone.",
    "Write down everything you hear.",
    "You must search the entire house now.",
    "They're listening",
    "Stop taking your medication.",
    "If you tell anyone, they’ll hurt you.",
    "They’re going to find you.",
    "Something terrible is going to happen if you dont leave.",
    "They know all your secrets.",
    "They can see inside your mind."
]

var hallucinating = true;

var tempround = document.getElementById("tempround");

function join() {
    socket.emit("join", document.getElementById("join-code-box").value, document.getElementById("name-box").value);
}

socket.on("join-success", () => {
    document.getElementById("join").style.display = "none";
});

socket.on("update", (time, round, roundnum, inbetween) => {
    tempround.innerHTML = "Round " + round + "/" + roundnum;
    document.getElementById("count").innerText = time;
    document.getElementById("round-countdown").innerText = time;

    if (inbetween) {
        document.getElementById("countdown").style.display = "none";
        document.getElementById("round-countdown").style.display = "block";
        document.getElementById("contribution").style.display = "block";
        document.getElementById("current").style.display = "block";
        document.getElementById("prompt-container").style.display = "block";
        document.getElementById("title").style.display = "block";
    } else {
        document.getElementById("countdown").style.display = "block";
        document.getElementById("round-countdown").style.display = "none";
        document.getElementById("contribution").style.display = "none";
        document.getElementById("current").style.display = "none";
        document.getElementById("prompt-container").style.display = "none";
        document.getElementById("title").style.display = "none";
    }
});

socket.on("start-success", () => {
    document.getElementById("game").style.display = "block";
    hallucinate();
});

socket.on("host-dc", () => {
    console.log("TEST");
});

socket.on("order-test", (order) => {
    console.log(order);
});

socket.on("request-addition", (index) => {
    console.log(index);
    socket.emit("addition", document.getElementById("contribution").value, index);
    document.getElementById("contribution").value = "";
})

socket.on("update-composition", (res, prompt) => {
    console.log(res);

    if(res && res.trim() == "") {
        res = "[Nothing written yet]";
    }

    document.getElementById("current").innerText = res;

    document.getElementById("prompt").innerText = prompt;
});

socket.on("game-over", (compositions) => {
    document.getElementById("game").style.display = "none";
    document.getElementById("contribution").style.display = "none";
    document.getElementById("current").style.display = "none";
    document.getElementById("reload").style.display = "block";
    document.getElementById("title").style.display = "block";
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

io.on("read-off", (res) => {

    hallucinating = false;
    
    if (Array.isArray(hallucinations) && hallucinations.length > 0) {
        i = Math.floor(Math.random() * hallucinations.length);
        meSpeak.speak(res, {amplitude: 100, pitch: ((Math.random() * 50) + 20), speed: ((Math.random() * 30) + 140), wordgap: 3, variant: ("" + (Math.random() < 0.5 ? 'm' : 'f') + (Math.floor(Math.random() * 4) + 1))});
    } else {
        console.error("Failed to speak a final story thing");
    }
});

var firstTime = true;
async function hallucinate() {

    ms = (Math.random() * 10000) + (firstTime ? 500 : 4000);
    firstTime = false;
    await new Promise(resolve => setTimeout(resolve, ms));

    if (Array.isArray(hallucinations) && hallucinations.length > 0) {
        i = Math.floor(Math.random() * hallucinations.length);
        console.log(hallucinations[i]);
        meSpeak.speak(hallucinations[i], {amplitude: 100, pitch: ((Math.random() * 50) + 20), speed: ((Math.random() * 30) + 140), wordgap: 3, variant: ("" + (Math.random() < 0.5 ? 'm' : 'f') + (Math.floor(Math.random() * 4) + 1))});
    } else {
        console.error('The hallucinations array is either not yet defined or empty.');
    }

    if(hallucinating) {
        hallucinate();
    }
}