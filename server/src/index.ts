import 'dotenv/config';

import connect from 'connect';
import fs from 'node:fs/promises';
import http from 'node:http';
import { minify } from 'csso';
import serveStatic from 'serve-static';
import { WebSocket, WebSocketServer } from 'ws';

import { Character } from 'types/character';
import { Session } from 'types/session';

const startTime = Date.now();

function getHashCode(str: string) {
    var hash = 0,
        i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}
const dmToken = getHashCode(process.env.DM_PASSWORD!);

const app = connect();
app.use(async (req, res, next) => {
    if (req.url && !req.url.match(/\./)) {
        let url = req.url;
        console.log(url);
        if (url == "/") {
            url = "/index";
        }
        res.write(await generateHTML(`${url}.html`));
        res.end();
        return;
    }
    if (!req.url?.match(/.*\.css$/)) {
        next();
        return;
    }
    let file = (await fs.readFile(`../client/${req.url}`)).toString();
    res.write(minify(file).css);
    res.end();
});
app.use(serveStatic("../client", { extensions: ['html'] }));

async function generateHTML(url: string) {
    let template = (await fs.readFile("assets/templates/common.html")).toString();
    let file;
    try {
        file = (await fs.readFile(`../client/${url}`)).toString();
    } catch (e) {
        return "";
    }

    let headStart = file.indexOf("<head>") + 6;
    let headEnd = file.indexOf("</head>");
    let head = file.substring(headStart, headEnd);

    let bodyStart = file.indexOf("<body>") + 6;
    let bodyEnd = file.indexOf("</body>");
    let body = file.substring(bodyStart, bodyEnd);

    return template.replace("$$head", head).replace("$$body", body);
}

let server = http.createServer(app);

const wss = new WebSocketServer({ server: server });

function sendMessage(ws: WebSocket, category: string, type: string, data?: any) {
    let obj = { category, type, ...data };
    let json = JSON.stringify(obj);
    console.log(`Sending to client:\n\t${json}`);
    ws.send(json);
}

function broadcast(category: string, type: string, data?: any) {
    for (let ws of wss.clients) {
        sendMessage(ws, category, type, data);
    }
}

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

let session: Session | null = null;

let messageCallbacks: { [key: string]: { [key: string]: Function } } = {};
messageCallbacks["system"] = {
    "connect": (ws: WebSocket, data: { status: string, startTime: number, connectTime?: number }) => {
        if (data.startTime < startTime) {
            console.log("Out of date client connected. Refreshing...");
            sendMessage(ws, "system", "refresh");
            return;
        }
        switch (data.status) {
        case "reconnecting":
            console.log(`Client reconnected after ${data.connectTime}`);
            break;
        case "refreshing":
            console.log("Refreshed client successfully reconnected!");
            break;
        default:
            console.log("New connection established!");
        }
        sendMessage(ws, "system", "confirm");
    },
    "console": (ws: WebSocket, data: { command: string }) => {
        console.log(`New text command received: ${data.command.toString()}`);
        if (data.command == process.env.DM_PASSWORD) {
            sendMessage(ws, "system", "dm", { token: dmToken });
            return;
        }
        handleCommand(data.command);
    },
}
messageCallbacks["character"] = {
    "chardata": (ws: WebSocket, data: any) => {
        console.log("Sending all character data...");
        sendMessage(ws, "character", "chardata", { chars: characters });
    }
}
messageCallbacks["session"] = {
    "ping": (ws: WebSocket) => {
        if (session === null) {
            console.log("No active session");
            sendMessage(ws, "session", "nosession");
            return;
        }

        console.log("Sending all session data...");
        sendMessage(ws, "session", "start");
    },
    "charnames": (ws: WebSocket) => {
        console.log("Sending charactern names...");
        sendMessage(ws, "session", "charnames", { charNames: characters.map(c => c.name) });
    },
    "chardata": (ws: WebSocket) => {
        if (session === null) {
            console.log("No active session");
            sendMessage(ws, "session", "nosession");
            return;
        }

        console.log("Sending all session data...");
        sendMessage(ws, "session", "chardata", { chars: session?.characters });
    },
    "start": (ws: WebSocket, data: any) => {
        let chars: Array<string> = data.chars;
        let sessionChars: Array<Character> = characters.filter(ch => chars.includes(ch.name));
        session = new Session(sessionChars);

        broadcast("session", "start");
    }
}

wss.on('connection', function connection(ws) {
    ws.on('error', console.error);

    ws.on('message', function message(json) {
        let data = JSON.parse(json.toString());
        console.log(`Message from client:\n\t${json}`);
        messageCallbacks[data.category]?.[data.type]?.(ws, data);
    });
});

server.listen(process.env.PORT);

const dmCommands: Map<string, Function> = new Map<string, Function>();

function handleCommand(str: string) {
    let args: Array<string> = [];
    let current: string = "";
    let quote: string | null = null;
    for (let i = 0; i < str.length; i++) {
        let c = str[i];
        if (c == "\\") {
            current += str[++i];
            continue;
        }
        if (quote != null) {
            if (c == quote)
                quote = null;
            else
                current += c;
            continue;
        }

        switch (c) {
        case '\"':
        case '\'':
            quote = c;
            continue;
        case ' ':
            args.push(current);
            current = "";
            continue;
        }

        current += c;
    }
    if (quote) {
        console.error("Invalid command: unclosed quote");
        return;
    }

    args.push(current);

    console.log(args);

    const command: string | undefined = args.shift();
    if (command)
        dmCommands.get(command)?.(args);
}

dmCommands.set("session", (args: Array<string>) => {
    switch (args[0]) {
    case "new":
        let sessionChars: Array<Character> = characters.filter(ch => args.includes(ch.name));
        session = new Session(sessionChars);

        broadcast("session", "start", { chars: session.characters });
        break;
    case "end":
        session = null;
        broadcast("session", "end");
        break;
    }
});
