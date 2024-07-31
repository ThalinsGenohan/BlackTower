"use strict";

if (localStorage.lightning === undefined) localStorage.lightning = true; // default true
if (localStorage.rain === undefined) localStorage.rain = true; // default true

if (document.getElementById("navbar") !== null) {
    fetch("/assets/templates/navbar.html")
        .then(data => { return data.text(); })
        .then(data => { document.getElementById("navbar").innerHTML = data; });
}

// General Utilities

function slugify(str) {
    return str.replace(/\s/g, "");
}

function getRandomNumber(min, max) {
    return (max - min) * Math.random() + min;
}

function loadImage(path) {
    return new Promise(resolve => {
        let image = new Image();
        image.onload = resolve.bind(resolve, image);
        image.src = path;
    });
}

// Websocket

const serverURL = `ws${(window.location.hostname != "localhost" ? "s" : "")}://${window.location.host}/ws`;

const systemCategory = "sys";

let messageCallbacks = {};

/** @type {WebSocket} */
let socket;

let reconnectDelay = 1;

const startTime = Date.now();

function connectToServer() {
    return new Promise((resolve, reject) => {
        socket = new WebSocket(serverURL);

        socket.addEventListener("error", (event) => {
            console.log(event);
        });

        socket.addEventListener("open", (event) => {
            sendMessage(systemCategory, "connect", { time: startTime });
            resolve(socket);
            reconnectDelay = 1;
        });

        socket.addEventListener("close", (event) => {
            console.log(`Socket disconnected. Waiting ${reconnectDelay} second${reconnectDelay == 1 ? '' : 's'} before retrying...`);
            setTimeout(connectToServer, reconnectDelay * 1000);
            reconnectDelay = Math.min(reconnectDelay * 2, 60)
        });

        socket.addEventListener("message", (event) => {
            console.log("Message from server: ", event.data);
            let data = JSON.parse(event.data);
            messageCallbacks[data.category](data);
        });
    });
}

function sendMessage(category, type, data) {
    let obj = { category, type, ...data };
    let json = JSON.stringify(obj);
    console.log("Sending to server:\n\t" + json);
    socket.send(json);
}

function handleSystemMessage(msg) {
    console.log("system message received");
    if (msg.type == "refresh") {
        window.location.reload();
    }
}
messageCallbacks[systemCategory] = handleSystemMessage;

// Black Tower Utilities

const smallFontWidth = 5;
const smallFontHeight = 7;
const smallFontCount = 12;
const smallFont = new Promise((resolve, reject) => {
    let image = new Image(smallFontWidth * smallFontCount, smallFontHeight);
    image.onload = resolve.bind(resolve, image);
    image.src = '/assets/fonts/small-font.png';
});
const smallFontChars = {
    '/': 50,
    '+': 55,
    '-': 60,
    '.': 65,
}

/**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Number} x 
 * @param {Number} y 
 * @param {String} string 
 */
async function writeSmall(ctx, x, y, string) {
    let xx = x;
    for (let i = 0; i < string.length; i++) {
        const c = string[i];

        let charX = smallFontChars[c] ?? smallFontWidth * c;

        switch (c) {
            case ' ':
                xx += smallFontWidth;
                break;
            default:
                ctx.drawImage(await smallFont, charX, 0, smallFontWidth, smallFontHeight, xx, y, smallFontWidth, smallFontHeight);
                xx += smallFontWidth;
        }
    }
}

const barBorder = loadImage('/assets/textures/bar-border.png');
const barFill = loadImage('/assets/textures/bar-fill.png');

/**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Number} x 
 * @param {Number} y 
 * @param {Number} width 
 * @param {Number} fillValue 
 * @param {Number} fillMax 
 * @param {String} fillColor 
 * @param {Image} labelImage 
 * @param {Boolean} text 
 */
async function drawBar(ctx, x, y, width, fillValue, fillMax, fillColor, labelImage, text = true) {
    const borderHeight = 9;
    const borderSliceX = {
        leftEdge: 0,
        label: 7,
        left: 8,
        middle: 13,
        right: 14,
    };
    const borderSliceW = {
        leftEdge: 7,
        label: 1,
        left: 5,
        middle: 1,
        right: 10,
    };

    const borderTexture = await barBorder;
    const fillTexture = await barFill;

    ctx.transform(1, 0, 0, 1, x, y);

    let currentX = 0;

    // Draw the empty label
    ctx.drawImage(borderTexture,
        borderSliceX.leftEdge, 0, borderSliceW.leftEdge, borderHeight,
        currentX, 0, borderSliceW.leftEdge, borderHeight
    );
    currentX += borderSliceW.leftEdge;

    const labelWidth = labelImage.width;
    ctx.drawImage(borderTexture,
        borderSliceX.label, 0, borderSliceW.label, borderHeight,
        currentX, 0, labelWidth, borderHeight
    );
    currentX += labelWidth;

    // Draw the empty bar
    ctx.drawImage(borderTexture,
        borderSliceX.left, 0, borderSliceW.left, borderHeight,
        currentX, 0, borderSliceW.left, borderHeight
    );
    currentX += borderSliceW.left;

    const blankWidth = width - currentX - borderSliceW.right;
    const fillStart = currentX + 2;
    ctx.drawImage(borderTexture,
        borderSliceX.middle, 0, borderSliceW.middle, borderHeight,
        currentX, 0, blankWidth, borderHeight
    );
    currentX += blankWidth;

    ctx.drawImage(borderTexture,
        borderSliceX.right, 0, borderSliceW.right, borderHeight,
        currentX, 0, borderSliceW.right, borderHeight
    );
    currentX += borderSliceW.right;

    // draw the label
    ctx.drawImage(labelImage, borderSliceW.leftEdge + 1, 1);

    // Skew canvas
    ctx.transform(1, 0, -1, 1, 0, 0);

    // draw the bar fill
    const fillWidth = (blankWidth + 6) * (fillValue / fillMax);
    ctx.fillStyle = fillColor;
    ctx.fillRect(fillStart, 1, fillWidth, 6);
    const oldGCO = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = "luminosity";
    ctx.drawImage(fillTexture,
        0.5, 0, 0.5, 8,
        fillStart, 0, Math.min(1, fillWidth), 8
    );
    ctx.drawImage(fillTexture,
        1.5, 0, 0.5, 8,
        fillStart + 1, 0, Math.max(0, fillWidth - 2), 8
    );
    ctx.drawImage(fillTexture,
        2.5, 0, 0.5, 8,
        fillStart + 1 + fillWidth - 2, 0, fillWidth <= 1 ? 0 : 1, 8
    );
    ctx.resetTransform();
    ctx.globalCompositeOperation = oldGCO;
}

/**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Number} x 
 * @param {Number} y 
 * @param {Number} fillValue 
 * @param {Number} fillMax 
 * @param {Number} fillColor 
 */
async function drawSegmentedBar(ctx, x, y, fillValue, fillMax, fillColor) {
    const segmentHeight = 6;
    const segmentSlicesX = {
        left: 0,
        middle: 8,
        right: 19,
    };
    const segmentSlicesW = {
        left: 8,
        middle: 11,
        right: 6,
    };
    const segmentBorder = await loadImage('/assets/textures/potion-bar.png');
    const segmentFill = await loadImage('assets/textures/potion-fill.png');

    ctx.transform(1, 0, 0, 1, x, y);

    let currentX = -segmentSlicesW.right;
    ctx.drawImage(segmentBorder,
        segmentSlicesX.right, 0, segmentSlicesW.right, segmentHeight,
        currentX, 0, segmentSlicesW.right, segmentHeight
    );

    for (let i = 0; i < fillMax; i++) {
        currentX -= segmentSlicesW.middle;
        ctx.drawImage(segmentBorder,
            segmentSlicesX.middle, 0, segmentSlicesW.middle, segmentHeight,
            currentX, 0, segmentSlicesW.middle, segmentHeight
        );

        if (fillValue >= fillMax - i) {
            const oldTransform = ctx.getTransform();
            ctx.transform(1, 0, -1, 1, -y, 0);
            ctx.fillStyle = fillColor;
            ctx.fillRect(currentX + 13, 1, segmentSlicesW.middle - 2, 3);
            ctx.setTransform(oldTransform);

            const oldGCO = ctx.globalCompositeOperation;
            ctx.globalCompositeOperation = "luminosity";
            ctx.drawImage(segmentFill,
                0, 0, 11, segmentHeight,
                currentX, 0, segmentSlicesW.middle, segmentHeight
            );

            ctx.globalCompositeOperation = oldGCO;
        }
    }

    currentX -= segmentSlicesW.left;
    ctx.drawImage(segmentBorder,
        segmentSlicesX.left, 0, segmentSlicesW.left, segmentHeight,
        currentX, 0, segmentSlicesW.left, segmentHeight
    );

    ctx.resetTransform();
}

// Misc

function fixCenterText() {
    let centerTexts = document.getElementsByClassName("center-text");
    for (let t of centerTexts) {
        t.style.paddingLeft = "0";
        let l = t.getBoundingClientRect().left;
        if (l % 1) {
            t.style.paddingLeft = "1px";
        }
    }
}
fixCenterText();

let bufferingCommand = false;
let keyBuffer = "";
document.addEventListener('keydown', (event) => {
    if (!bufferingCommand && event.key != "`") {
        return;
    }

    switch (event.key) {
        case "`":
            bufferingCommand = !bufferingCommand;
            keyBuffer = "";
            break;
        case "Enter":
            console.log(`Sending command: '${keyBuffer}'`);
            sendMessage(systemCategory, "textcommand", { command: keyBuffer })
            bufferingCommand = false;
            keyBuffer = "";
            break;
        case "Backspace":
            keyBuffer = keyBuffer.substring(0, keyBuffer.length - 1);
            break;
        default:
            keyBuffer += event.key;
    }
    rainWidth = bufferingCommand ? 2 : 1;
});
