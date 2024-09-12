let consoleOpen = false;
let consoleBuffer = "";
let consoleCursor = 0;
let consolePreCursor = "";
let consolePostCursor = "";
document.addEventListener('keydown', (event) => {
    if (!consoleOpen) {
        switch (event.key) {
            case "`":
                toggleConsole();
                break;
            case "\\":
                if (!dmUnlocked)
                    break;
                toggleDMMode();
                break;
        }
        return;
    }

    switch (event.key) {
        case "Enter":
            consoleBuffer = `${consolePreCursor}${consolePostCursor}`.trim();
            if (consoleBuffer != "") {
                console.log(`Sending command: '${consoleBuffer}'`);
                sendConsoleCommand(consoleBuffer);
            }
        case "Escape":
            toggleConsole();
            break;
        case "Backspace":
            if (consoleCursor == 0)
                break;

            consolePreCursor = consolePreCursor.substring(0, consolePreCursor.length - 1);
            consoleBuffer = `${consolePreCursor}|${consolePostCursor}`;
            document.getElementById("console-input").innerHTML = `> ${consoleBuffer}`;
            consoleCursor--;
            break;
        case "Delete":
            if (consoleCursor >= consoleBuffer.length - 1)
                break;

            consolePostCursor = consolePostCursor.substring(1, consolePreCursor.length);
            consoleBuffer = `${consolePreCursor}|${consolePostCursor}`;
            document.getElementById("console-input").innerHTML = `> ${consoleBuffer}`;
            break;
        case "Tab":
            break;
        case "ArrowLeft":
            if (consoleCursor == 0)
                break;
            consoleCursor--;

            consolePostCursor = consolePreCursor.charAt(consolePreCursor.length - 1) + consolePostCursor;
            consolePreCursor = consolePreCursor.substring(0, consoleCursor);
            consoleBuffer = `${consolePreCursor}|${consolePostCursor}`;
            document.getElementById("console-input").innerHTML = `> ${consoleBuffer}`;
            break;
        case "ArrowRight":
            if (consoleCursor >= consoleBuffer.length - 1)
                break;
            consoleCursor++;

            consolePreCursor = consolePreCursor + consolePostCursor.charAt(0);
            consolePostCursor = consolePostCursor.substring(1, consolePostCursor.length);
            consoleBuffer = `${consolePreCursor}|${consolePostCursor}`;
            document.getElementById("console-input").innerHTML = `> ${consoleBuffer}`;
            break;

        default:
            if (event.key.length > 1)
                break;

            consolePreCursor += event.key;
            consoleCursor++;
            consoleBuffer = `${consolePreCursor}|${consolePostCursor}`;

            document.getElementById("console-input").innerHTML = `> ${consoleBuffer}`;
    }
    event.preventDefault();
});

const consoleElement = document.getElementById("console");
const consoleInputElement = document.getElementById("console-input");
let consoleFading = false;
function toggleConsole() {
    if (consoleOpen) {
        consoleOpen = false;
        for (let l of consoleElement.children) {
            l.classList.add("hidden");
        }
        consoleInputElement.classList.add("hidden");
        consoleInputElement.innerHTML = "";
        consoleBuffer = "";
        consolePreCursor = "";
        consolePostCursor = "";
        return;
    }

    consoleOpen = true;
    consoleFading = false;
    for (let l of consoleElement.children) {
        l.classList.remove("console-fade");
        l.classList.remove("hidden");
    }
    consoleInputElement.classList.remove("hidden");
    consoleInputElement.innerHTML = "> |";
}

let dmToken = "";
let dmUnlocked = false;
let dmMode = false;
function unlockDMMode(msg) {
    dmToken = msg.token;
    dmUnlocked = true;

    document.cookie = `dm_token=${dmToken}`;

    toggleDMMode();
}
systemCallbacks["dm"] = unlockDMMode;

function toggleDMMode() {
    dmMode = !dmMode;
    let color = `var(--${dmMode ? "accent" : "main"}-color)`;
    document.getElementById("navbar-header").style.color = color;
    if (dmMode)
        document.body.classList.add("dm-mode");
    else
        document.body.classList.remove("dm-mode");
}

/**
 * 
 * @param {string} str 
 */
function sendConsoleCommand(str) {
    let space = str.indexOf(" ");
    if (space == -1) {
        sendMessage("console", str);
        return;
    }
    let command = str.substring(0, space).trim();
    let args = str.substring(space, str.length).trim();
    sendMessage("console", command, { args: args });
}

let consoleCallbacks = {};
function handleConsoleMessage(msg) {
    consoleCallbacks[msg.type]?.(msg);
}
messageCallbacks["console"] = handleConsoleMessage;

function handleLog(msg) {
    let logLine = document.createElement("div");
    logLine.classList.add("console-log", "console-fade");
    logLine.innerHTML = msg.str;
    consoleElement.appendChild(logLine);
    consoleFading = true;
    setTimeout(hideConsoleLog, 6500, logLine);

    if (consoleElement.childElementCount > 8) {
        consoleElement.removeChild(consoleElement.firstChild);
    }

};
consoleCallbacks["log"] = handleLog;

function hideConsoleLog(line) {
    if (!consoleFading)
        return;

    line.classList.add("hidden");
    line.classList.remove("console-fade");
    consoleFading = false;
}
