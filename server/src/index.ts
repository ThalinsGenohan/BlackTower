import 'dotenv/config';

import connect from 'connect';
import fs from 'node:fs/promises';
import http from 'node:http';
import { minify } from 'csso';
import serveStatic from 'serve-static';
import { WebSocket, WebSocketServer } from 'ws';

import { Character } from 'types/character';

const startTime = Date.now();

const app = connect();
app.use(async (req, res, next) => {
    if (!req.url?.match(/.*\.css$/)) {
        next();
        return;
    }
    let file = (await fs.readFile(`../client/${req.url}`)).toString();
    res.write(minify(file).css);
    res.end();
});
app.use(serveStatic("../client", { extensions: ['html'] }));

let server = http.createServer(app);

const wss = new WebSocketServer({ server: server });

let characters: Array<Character> = [];

let charFiles = [];
fs.readdir("characters/").then((value) => {
    charFiles = value;
    charFiles.forEach(file => {
        console.log(file);
        Character.load(file).then((c) => {
            characters.push(c);
        })
    });
    characters.sort((a, b) => a.name.localeCompare(b.name));
});


const categories = {
    system: "sys",
    character: "char",
}

let messageCallbacks: { [key: string]: { [key: string]: Function } } = {};
messageCallbacks[categories.system] = {
    "connect": (ws: WebSocket, data: any) => {
        console.log("New connection established!");
        if (data.time < startTime) {
            ws.send(JSON.stringify({ category: categories.system, type: "refresh" }));
            return;
        }
        ws.send(JSON.stringify({ category: categories.system, type: "confirm" }));
    }
}
messageCallbacks[categories.character] = {
    "allfull": (ws: WebSocket, data: any) => {
        console.log("Sending all character data...");
        ws.send(JSON.stringify({ category: categories.character, type: "allfull", chars: characters }));
    }
}

wss.on('connection', function connection(ws) {
    ws.on('error', console.error);

    ws.on('message', function message(json) {
        let data = JSON.parse(json.toString());
        messageCallbacks[data.category]?.[data.type]?.(ws, data);
    });
});

server.listen(process.env.PORT);
