const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// dictionary storing 
var room = {};

let ROUND_LENGTH = 10;
let PAUSE_LENGTH = 2;
let MIN_ROUNDS = 3;

let prompt = [
    "Satoru Gojo walks into a bar...",
    "Scary Knifes Guy is looking.",
    "Wait a minute... where is my dick?",
    "General Piss Pants' forces were being decimated on the battlefield.",
    "Scooby Doo but instead of catching a monster, they're catching a predator.",
    "Somebody shat in the Urinal and now we're all in danger.",
    "Mom, that is not my hentai, I was just holding it for a friend!",
    "There is a Category 5 Fartnado heading towards Tilted Towers!",
    "The minecraft villagers escaped from their containment vessel... and they don't look happy.",
    "The monkeys finally admitted that they are just as smart as us and just pretended to be dumbasses to avoid taxes... Do we give them rights?",
    "Joe Biden just announced that he is bringing slavery back to the United States.",
    "Genghis Khan came back to life and he's trying to rizz up all of the women again.",
    "Just write something.",
    "Where did Cotton Eye Joe come from? And where did he go?",
    "There's some dude outside of my apartment looking in with binoculars?",
];


io.on("connection", (socket) => {

    // HOST GAME FUNCTIONS
    socket.on("host", (check) => {
        // If host reconnecting use the cookie room code
        if (Object.keys(room).includes(check) && room[check].host == null) {
            room[check].host = socket;
            socket.room = check;
            if (room[socket.room]) {
                room[socket.room].count += 1;
            } else {
                console.error(`Room ${socket.room} is not defined.`);
            }
            socket.join(socket.room);
            socket.emit("room-code-assignment", socket.room);
            console.log("Room " + socket.room + " host returned");
        }
    });
    // GENERATE ROOM CODE
    socket.on("get-code", () => {
        socket.room = generateRoomCode();
        console.log("new room: " + socket.room);
        socket.join(socket.room);
        socket.started = false;
        room[socket.room] = { count: 1, host: socket, clients: [], composition: [], prompt: [], joinable: true };
        socket.emit("room-code-assignment", socket.room);
        console.log(Object.keys(room));
    });
    socket.on("start", () => {
        if (room[socket.room].count > 1) {
            start(socket);
            console.log(socket.room + " Started Game");
            io.to(socket.room).emit("start-success");
            socket.started = true;
        } else {
            console.log(socket.room + " failed to start game, not enough players");
            socket.emit("start-fail", "not enough players");
        }
    });
    socket.on("speaking", (res) => {
        io.to(socket.room).emit("read-off", res);
    });


    // CLIENT FUNCTIONS
    // ON INITAL JOIN
    socket.on("join", (roomcode, name) => {

        console.log("Client attempting to join: " + roomcode + "...");

        if (socket.room) {
            console.log("Already in a room");
            return;
        }

        if (checkCode(roomcode)) {
            socket.room = roomcode;
            console.log("> join successful");
            room[socket.room].count += 1;
            socket.name = name;
            room[socket.room].clients.push(socket);

            console.log(room[socket.room].clients.map(clients => clients.name));
            room[socket.room].host.emit("update-players", room[socket.room].clients.map(clients => clients.name));

            socket.name = name;
            socket.join(roomcode);

            socket.emit("join-success");
        } else {
            console.log("> attempt to join room \"" + roomcode + "\" failed, DNE");
            socket.emit("join-failed");
        }
    });

    // handle client submitting an addition
    socket.on("addition", (res, index) => {
        if (!room[socket.room].composition) {
            room[socket.room].composition = [];
        }
        if (!room[socket.room].composition[index]) {
            room[socket.room].composition[index] = "";
        }
        room[socket.room].composition[index] = room[socket.room].composition[index].concat((res.trim().concat(" ")));
    });

    // DISCONNECTION HANDLING
    socket.on("disconnect", () => {

        //HOST DISCONNECT
        if (socket.room && room[socket.room] && room[socket.room].host && room[socket.room].host == socket) {
            console.log("HOST DISCONNECTION: " + socket.room);

            io.in(socket.room).fetchSockets().then((sockets) => {
                sockets.forEach((s) => {
                    s.emit("host-dc");
                    s.room = null;
                    if (s.name) {
                        console.log(s.name + " > removed from " + s.room);
                    } else {
                        console.log("socket with id: " + s.id + " > removed from " + s.room);
                    }
                });
            }).catch((error) => {
                console.error(`Error fetching sockets: ${error}`);
            });

            console.log("Room " + socket.room + " without host > ROOM DELETED.")
            delete room[socket.room];

            console.log("Room evactuated: " + socket.room);
        }
        // CLIENT DISCONNECT
        else if (socket.room) {
            room[socket.room].clients.splice(room[socket.room].clients.indexOf(socket), 1);
            console.log(socket.name + " has left room " + socket.room);
            room[socket.room].host.emit("update-players", room[socket.room].clients.map(clients => clients.name));
            socket.room = null;
            socket.leave(socket.room);
        }

        if (socket.room && room[socket.room] && (room[socket.room].count -= 1) <= 0) {
            console.log("Room " + socket.room + " empty > ROOM DELETED.")
            delete room[socket.room];
        }
    });
});

function checkCode(roomcode) {
    if (Object.keys(room).includes(roomcode)) {
        return true;
    }
    return false;
}

function generateRoomCode() {
    let letters = "";
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";
    for (let i = 0; i < 4; i++) {
        const randomIndex = Math.floor(Math.random() * alphabet.length);
        letters += alphabet[randomIndex];
    }

    if (Object.keys(room).includes(letters)) {
        return generateRoomCode();
    }
    return letters;
}


// GAME CODE

function start(socket) {

    socket.inbetween = true;

    if (room[socket.room].timer && room[socket.room].round) {
        // NOTHING YET
        // ERROR
    } else {
        room[socket.room].timer = 0;
        room[socket.room].round = 0;
        room[socket.room].playercount = room[socket.room].clients.length;

        //shuffle client order
        let clients = room[socket.room].clients;
        for (let i = clients.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [clients[i], clients[j]] = [clients[j], clients[i]];
        }

        clients.forEach(client => {
            client.index = clients.indexOf(client);
        });
    }

    if (!room[socket.room].composition) {
        room[socket.room].composition = [];
    }

    if (!room[socket.room].prompt) {
        room[socket.room].prompt = [];
    }

    // generate random prompts for each index
    var promptlist = [...prompt];
    for (var p = 0; p < room[socket.room].playercount; p++) {
        if (promptlist.length == 0) {
            promptlist.push("Just write something, all the prompts are taken.");
        }

        const randomIndex = Math.floor(Math.random() * promptlist.length);
        var randomElement = "" + promptlist[randomIndex];

        promptlist.splice(randomIndex, 1);

        room[socket.room].prompt.push(randomElement);
    }
    console.log(room[socket.room].prompt);

    room[socket.room].roundNum = room[socket.room].playercount;
    while (room[socket.room].roundNum < MIN_ROUNDS) {
        room[socket.room].roundNum *= 2;
    }

    update(socket);
}

async function update(socket) {
    if (!socket.room || !room[socket.room]) {
        console.error(`Room or socket.room is undefined. socket.room: ${socket.room}`);
        return;
    }

    room[socket.room].timer -= 1;

    if (room[socket.room].timer <= 0) {

        if (socket.inbetween) {
            room[socket.room].timer = PAUSE_LENGTH;
            room[socket.room].round += 1;

            io.in(socket.room).fetchSockets().then((sockets) => {
                sockets.forEach((s) => {
                    if (s != socket) {
                        s.emit("request-addition", (s.index + (room[socket.room].round - 1)) % room[socket.room].playercount);
                    }
                });
            }).catch((error) => {
                console.error(`Error fetching sockets: ${error}`);
            });

        } else {

            room[socket.room].timer = ROUND_LENGTH;
        }
        
        // IF FINAL OUND OVER
        if (room[socket.room].round > room[socket.room].roundNum) {

            //request last update
            io.in(socket.room).fetchSockets().then((sockets) => {
                sockets.forEach((s) => {
                    if (s != socket) {
                        s.emit("update-composition", 
                            room[socket.room].composition[(((s.index + (room[socket.room].round - 1)) - 1) + room[socket.room].playercount) % room[socket.room].playercount], 
                            room[socket.room].prompt[(((s.index + (room[socket.room].round - 1)) - 1) + room[socket.room].playercount) % room[socket.room].playercount]
                        );
                        console.log(room[socket.room].prompt[(((s.index + (room[socket.room].round - 1)) - 1) + room[socket.room].playercount) % room[socket.room].playercount]);
                    }
                });
            }).catch((error) => {
                console.error(`Error fetching sockets: ${error}`);
            });

            io.to(socket.room).emit("transitioning");
            await new Promise(resolve => setTimeout(resolve, 1000)); // wait one second for last compositions to update

            io.in(socket.room).fetchSockets().then((sockets) => {
                sockets.forEach((s) => {
                    s.emit("game-over", room[socket.room].composition, room[socket.room].prompt);
                });
            }).catch((error) => {
                console.error(`Error fetching sockets: ${error}`);
            });
            clearTimeout(socket.timerId);
            return;
        } else {
            socket.inbetween = !socket.inbetween;
        }
    }

    io.in(socket.room).fetchSockets().then((sockets) => {
        sockets.forEach((s) => {
            if (s != socket) {
                s.emit("update-composition", 
                    room[socket.room].composition[(((s.index + (room[socket.room].round - 1)) - 1) + room[socket.room].playercount) % room[socket.room].playercount], 
                    room[socket.room].prompt[(((s.index + (room[socket.room].round - 1)) - 1) + room[socket.room].playercount) % room[socket.room].playercount]
                );
                //console.log(room[socket.room].prompt[(((s.index + (room[socket.room].round - 1)) - 1) + room[socket.room].playercount) % room[socket.room].playercount]);
            }
        });
    }).catch((error) => {
        console.error(`Error fetching sockets: ${error}`);
    });

    io.to(socket.room).emit("update", room[socket.room].timer, room[socket.room].round, room[socket.room].roundNum, socket.inbetween);

    socket.timerId = setTimeout(() => update(socket), 1000);
}


app.use("/", express.static(path.join(__dirname + "/public")));
app.use("/host", express.static(path.join(__dirname + "/host")));
app.use("/play", express.static(path.join(__dirname + "/client")));

server.listen(3001);
console.log("Listening on port 3001");