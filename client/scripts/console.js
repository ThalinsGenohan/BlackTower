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
                sendMessage("system", "console", { command: consoleBuffer });
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

function toggleConsole() {
    const consoleElement = document.getElementById("console");
    const consoleInputElement = document.getElementById("console-input");
    if (consoleOpen) {
        consoleOpen = false;
        consoleElement.classList.add("hidden");
        consoleInputElement.innerHTML = "";
        consoleBuffer = "";
        consolePreCursor = "";
        consolePostCursor = "";
        return;
    }

    consoleOpen = true;
    consoleElement.classList.remove("hidden");
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