var socket = io();

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