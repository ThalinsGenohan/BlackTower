import 'dotenv/config';

import connect from 'connect';
import fs from 'node:fs/promises';
import http from 'node:http';
import { minify } from 'csso';
import serveStatic from 'serve-static';
import { WebSocket, WebSocketServer } from 'ws';

import { Character, JobClass, JobClasses, PronounList } from 'types/character';
import { SessionCharacter, Buff, Gem } from 'types/session-character';
import { Session } from 'types/session';

const startTime = Date.now();

interface Indexable {
    [key: string]: any;
}

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
        if (data.category != "console") {
            messageCallbacks[data.category]?.[data.type]?.(ws, data);
            return;
        }
        if (data.type == process.env.DM_PASSWORD) {
            sendMessage(ws, "system", "dm", { token: dmToken });
            sendConsoleLog(ws, "DM mode unlocked");
            return;
        }
        handleCommand(ws, data.type, data.args);
        return;
    });
});

server.listen(process.env.PORT);

const dmCommands: Map<string, Function> = new Map<string, Function>();

function sendConsoleLog(ws: WebSocket, log: string) {
    sendMessage(ws, "console", "log", { str: log });
}

function handleCommand(ws: WebSocket, command: string, argsStr?: string) {
    if (!argsStr) {
        let comm = dmCommands.get(command);
        if (!comm) {
            sendConsoleLog(ws, `Command '${command} not found`);
            return;
        }
        comm!(ws, null);

        return;
    }

    let args: Array<string> = [];
    let current: string = "";
    let quote: string | null = null;
    for (let i = 0; i < argsStr.length; i++) {
        let c = argsStr[i];
        if (c == "\\") {
            current += argsStr[++i];
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

    let comm = dmCommands.get(command);
    if (!comm) {
        sendConsoleLog(ws, `Command '${command} not found`);
        return;
    }
    comm!(ws, args);
}

dmCommands.set("session", (ws: WebSocket, args: Array<string>) => {
    switch (args[0]) {
    case "new":
        let sessionChars: Array<Character> = characters.filter(ch => args.includes(ch.name));
        session = new Session(sessionChars);

        broadcast("session", "start", { chars: session.characters });
        sendConsoleLog(ws, `Started new session with ${sessionChars.length} characters.`);
        break;
    case "end":
        session = null;
        broadcast("session", "end");
        sendConsoleLog(ws, "Ended the current session.");
        break;
    case "turn":
        if (session == null) {
            sendConsoleLog(ws, "There is not currently a session active");
            return;
        }

        for (let c of session.characters) {
            for (let b in c.buffs) {
                let buff = c.buffs[b]!;
                buff.onTurn?.();
                buff.turnsRemaining--;
                if (buff.turnsRemaining <= 0) {
                    buff.onClear?.();
                    buff.unapply?.();
                    delete c.buffs[b];
                }
            }
        }

        broadcast("session", "turn", { chars: session?.characters });
        break;
    }
});

dmCommands.set("data", (ws: WebSocket, args: Array<string>) => {
    if (session == null) {
        sendConsoleLog(ws, "Data command can only be used when a session is active. Did you mean chardata?");
        return;
    }
    if (!args || args.length < 3) {
        sendConsoleLog(ws, "Data command missing args: data <character> <data> <new value>");
        return;
    }

    const cName = args[0];
    let character = session.characters.find(c => c.name == cName);
    if (character == undefined) {
        sendConsoleLog(ws, `Character '${cName}' not found`);
        return;
    }

    let layers = args[1]!.split(".")!;
    let lastLayer = layers.pop()!;

    let current = character as Indexable;
    for (let layer of layers) {
        if (!Object.hasOwn(current, layer)) {
            sendConsoleLog(ws, `Unknown key: '${layer}' from '${args[1]}'`);
            return;
        }
        current = current[layer];
    }
    if (!Object.hasOwn(current, lastLayer)) {
        sendConsoleLog(ws, `Unknown key: '${lastLayer}' from '${args[1]}'`);
        return;
    }

    let data: any = args[2];
    switch (typeof (current[lastLayer])) {
    case 'number':
        data = Number(data);
        break;
    case 'string':
        data = String(data);
        break;

    case 'object':
        switch (lastLayer) {
        case "equippedClass":
            if (data == "null") {
                data = null;
                break;
            }
            if (data == character.specialtyClass.name) {
                sendConsoleLog(ws, "Cannot equip the same class twice");
                return;
            }
            data = JobClasses[data];
            if (!data) {
                sendConsoleLog(ws, `Class '${args[2]}' does not exist`);
                return;
            }
            break;
        default:
            console.log(`Unknown type: ${current[lastLayer].__proto__}`);
            break;
        }
        break;
    }
    current[lastLayer] = data;

    sendMessage(ws, "session", "char", { char: character });
});

dmCommands.set("buff", (ws: WebSocket, args: Array<string>) => {
    if (session == null) {
        sendConsoleLog(ws, "Buff command can only be used when a session is active");
        return;
    }
    if (!args || args.length < 5) {
        sendConsoleLog(ws, "Buff command missing args: buff <player> <name> <icon> <turns> [effects...]");
        return;
    }

    const cName = args.shift();
    let character = session.characters.find(c => c.name == cName);
    if (character == undefined) {
        sendConsoleLog(ws, `Character '${cName}' not found`);
        return;
    }

    let name: string = args.shift()!;
    let iconID: string = args.shift()!;
    let turns: number = Number(args.shift()!);
    let effects: { [key: string]: string } = {};
    for (let arg of args) {
        let effect = arg.split(':');
        if (effect.length != 2) {
            return;
        }
        effects[effect[0]!] = effect[1]!;
    }

    let buff = new Buff();
    buff.name = name;
    buff.icon = iconID;
    buff.turnsRemaining = turns;

    // Separate triggers
    for (let [when, what] of Object.entries(effects)) {
        // Separate stats
        let whatParts = what.split(',');
        let actions: { stat: string, num: number }[] = [];
        let unapplyActions: { stat: string, num: number }[] = [];
        for (let whatPart of whatParts) {
            let [stat, op, numStr] = whatPart.split(/\b/);
            if (!stat || !op || !numStr) {
                return;
            }
            let num = Number(op + numStr);
            actions.push({ stat, num });
            if (when == "apply")
                unapplyActions.push({ stat, num: -num });
        }

        switch (when) {
        case "apply":
            ActivateBuff(character, actions);
            buff.unapply = ActivateBuff.bind(null, character, unapplyActions);
            break;
        case "clear":
            buff.onClear = ActivateBuff.bind(null, character, actions);
            break;
        case "turn":
            buff.onTurn = ActivateBuff.bind(null, character, actions);
            break;
        case "in":
            buff.onIncoming = ActivateBuff.bind(null, character, actions);
            break;
        case "out":
            buff.onOutgoing = ActivateBuff.bind(null, character, actions);
            break;
        }
    }
    character.buffs[buff.name] = buff;
    sendMessage(ws, "session", "char", { char: character });
});

function ActivateBuff(character: SessionCharacter, actions: { stat: string, num: number }[]) {
    for (let action of actions) {
        let statKey: string = action.stat;
        switch (action.stat) {
        case "hp":
            statKey = "currentHP";
            break;
        case "mp":
            statKey = "currentMP";
            break;
        }
        if (!Object.hasOwn(character, statKey)) {
            character.tempStats[statKey] = action.num + (character.tempStats[statKey] ?? 0);
        }
        else {
            (character as Indexable)[statKey] += action.num;
        }
    }
}
