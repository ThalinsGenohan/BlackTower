require('dotenv').config();

let connect = require('connect');
let fs = require('fs').promises;
let serveStatic = require('serve-static');
let { WebSocketServer } = require('ws');
let http = require('http');
let { minify } = require('csso');

let Character = require('./character.js');

const app = connect();
app.use(async (req, res, next) => {
    if (!req.url.match(/.*\.css$/)) {
        next();
        return;
    }
    console.log(req.url);
    let file = (await fs.readFile(`../client/${req.url}`)).toString();
    res.write(minify(file).css);
    res.end();
});
app.use(serveStatic("../client", { extensions: ['html'] }));

let server = http.createServer(app);

const wss = new WebSocketServer({ server: server });

let characters = [];

let charFiles = [];
fs.readdir("characters/").then((value) => {
    charFiles = value;
    charFiles.forEach(file => {
        console.log(file);
        Character.load(file).then((c) => {
            characters.push(c);
        })
    });
    characters.sort((a, b) => a.name < b.name);
});


const categories = {
    system: "sys",
    character: "char",
}

let messageCallbacks = {};
messageCallbacks[categories.system] = {
    "connect": (ws, data) => {
        console.log("New connection established!");
        ws.send(JSON.stringify({ category: categories.system, type: "confirm" }));
    }
}
messageCallbacks[categories.character] = {
    "allfull": (ws, data) => {
        console.log("Sending all character data...");
        ws.send(JSON.stringify({ category: categories.character, type: "allfull", chars: characters }));
    }
}

wss.on('connection', function connection(ws) {
    ws.on('error', console.error);

    ws.on('message', function message(json) {
        console.log('received: %s', json);

        let data = JSON.parse(json);
        messageCallbacks[data.category][data.type](ws, data);
    });
});


function handleCharacterListRequest(ws, data) {
}

function handleFullCharacterRequest(ws, data) {
    console.log(`Sending data for character '${data.name}'...`);
    ws.send(JSON.stringify({ type: "fullchar_ans" }));
}

server.listen(process.env.PORT);
