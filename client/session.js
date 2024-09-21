const charactersElement = document.getElementById("characters");
const sheetTemplate = fetch("/assets/templates/character-sheet-session.html")
    .then(sheet => sheet.text());

const skillEntryTemplate = fetch("/assets/templates/skill-list-entry.html")
    .then(entry => entry.text());

let sessionCallbacks = {};

async function addFullSheet(charID) {
    let template = await sheetTemplate;
    if (document.getElementById(charID)) {
        return;
    }

    let element = document.createElement("div");
    element.id = charID;
    element.innerHTML = template.replace(/\{cID\}/g, charID);
    charactersElement.append(element);

    let skillTabs = element.querySelectorAll(".skill-tab");
    for (let i = 0; i < skillTabs.length; i++) {
        skillTabs.item(i).addEventListener("click", handleSkillTabs.bind(null, charID, skillTabs, i));
    }
}

async function addSkillEntry(charID, jobClass, skillID) {
    let template = await skillEntryTemplate;
    let element = document.createElement("div");
    element.className = "table-item";
    element.id = `${charID}-skills-${skillID}`;
    element.innerHTML = template.replace(/\{cID\}/g, charID).replace(/\{skillName\}/g, skillID);

    let skillList = document.querySelector(`#${charID} [data-update="${jobClass}-skills"]`);
    skillList.append(element);
    return element;
}

/** @type {{ [charID: string]: SessionCharacter }} */
let characters = {};

/**
 * 
 * @param {Event} event
 * @param {string} cID
 * @param {NodeListOf<Element>} tabs
 * @param {number} tabNum
 */
function handleSkillTabs(cID, tabs, tabNum) {
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove("accent-text");
        let listID = `${cID}-skill-list-${i + 1}`;
        document.getElementById(listID).classList.add("hidden");
    }

    tabs[tabNum].classList.add("accent-text");
    let listID = `${cID}-skill-list-${tabNum + 1}`;
    document.getElementById(listID).classList.remove("hidden");
}

/**
 * 
 * @param {SessionCharacter} c 
 */
async function updateCharacter(c) {
    const cID = slugify(c.name);
    characters[cID] = c;

    let skillTabs = document.getElementById(cID).querySelectorAll(".skill-tab");
    for (let tab of skillTabs) {
        tab.classList.remove("hidden");
    }
    if (c.equippedClass == null) {
        skillTabs[1]?.classList.add("hidden");
    }

    let things = Object.keys(
        Object.getOwnPropertyDescriptors(c)
    ).concat(Object.keys(
        Object.getOwnPropertyDescriptors(Reflect.getPrototypeOf(c))
    ));

    for (let key of things) {
        if (typeof c[key] === "object") {
            for (let sub in c[key]) {
                if (sub == "skills") {
                    updateCharacterSkills(cID, key, c[key][sub]);
                    continue;
                }
                updateCharacterData(cID, `${key}-${sub}`, c[key][sub]);
            }
            continue;
        }
        updateCharacterData(cID, key, c[key]);
    }

    // TEMP
    updateBar(cID, "hp", c.currentHP, c.maxHP, 2);
    updateBar(cID, "mp", c.currentMP, c.maxMP, 1);
    updateClassMechanic(cID, 1);
    updateClassMechanic(cID, 2);
    updateGems(cID, c.gems);
    updateBuffs(cID, c.buffs);

    fixCenterText();
}
sessionCallbacks["char"] = msg => updateCharacter(new SessionCharacter(msg.char));

const barColors = {
    hp: "#00cc00",
    mp: "#00bbbb",
};

async function updateBar(cID, bar, current, max, potionCount) {
    /** @type {HTMLCanvasElement} */
    let canvas = document.getElementById(`${cID}-${bar}-canvas`);
    /** @type {CanvasRenderingContext2D} */
    let ctx = canvas.getContext("2d");

    const width = canvas.width = 81;
    const height = canvas.height = 16;
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = false;

    // resource bar
    const numPos = { x: width - 45, y: 2 };
    drawBar(ctx, 0, 0, width, current, max, barColors[bar], await loadImage(`/assets/textures/${bar}-label.png`)).then(() => {
        writeSmall(ctx, numPos.x, numPos.y, `${' '.repeat(3 - current.toString().length)}${current}/${' '.repeat(3 - max.toString().length)}${max}`);
    });

    // potion counter
    drawSegmentedBar(ctx, width - 8, 9, potionCount, 3, barColors[bar]);
}

function updateCharacterData(cID, key, data) {
    let elems = document.querySelectorAll(`#${cID} [data-update="${key}"]`);
    if (elems.length < 1)
        return;

    for (let elem of elems) {
        if (elem?.tagName == "IMG") {
            elem.srcset = data;
            elem.alt = cID;
            continue;
        }
        if (elem.getAttribute("data-stat") == "relative") {
            if (data > 0) {
                data = `${data}`;
                elem.classList.add("positive");
            }
            if (data < 0) {
                elem.classList.add("negative");
            }
            if (data == 0) {
                data = `±${data}`;
                elem.classList.add("zero");
            }
        }

        elem.textContent = data;
    }
}

async function updateCharacterSkills(cID, jobClass, data) {
    for (let skill of data) {
        const skillID = slugify(skill.name);
        let elem = document.getElementById(`${cID}-skills-${skillID}`);
        if (elem === null) {
            await addSkillEntry(cID, jobClass, skillID);
        }
        for (let key in skill) {
            updateCharacterData(`${cID}-skills-${skillID}`, `skill-${key}`, skill[key]);
        }
    }
}

async function updateClassMechanic(cID, num) {
    /** @type {HTMLCanvasElement} */
    let canvas = document.getElementById(`${cID}-class-mech-${num}`);
    /** @type {CanvasRenderingContext2D} */
    let ctx = canvas.getContext("2d");

    const width = canvas.width = 81;
    const height = canvas.height = 32;
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = false;

    const current = 100;
    const max = 100;
    const y = 16;

    const numPos = { x: width - 45, y: y + 2 };
    drawBar(ctx, 0, y, width, current, max, "hsl(51 100 50%)", await loadImage(`/assets/textures/mp-label.png`)).then(() => {
        writeSmall(ctx, numPos.x, numPos.y, `${' '.repeat(3 - current.toString().length)}${current}/${' '.repeat(3 - max.toString().length)}${max}`);
    });
}

/**
 * 
 * @param {string} cID 
 * @param {{ [key: string]: Buff }} buffs 
 */
async function updateBuffs(cID, buffs) {
    /** @type {HTMLCanvasElement} */
    let canvas = document.getElementById(`${cID}-buffs-canvas`);
    /** @type {CanvasRenderingContext2D} */
    let ctx = canvas.getContext("2d");

    const width = canvas.width = 72;
    const height = canvas.height = 23;
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = false;

    const y = 3;
    let x = (width / 2) - (12 * Object.keys(buffs).length / 2);
    for (let b in buffs) {
        let buff = buffs[b];
        let buffIconPath = `/assets/images/buffs/${buff.icon}.png`;
        let buffIcon = await loadImage(buffIconPath);
        ctx.drawImage(buffIcon, x, y);
        writeSmall(ctx, x + 3, y + (buff.icon.match(/-down/) ? -3 : 13), buff.turnsRemaining);
        x += 12;
    }
}

async function updateGems(cID, gems) {

}

connectingToServer.then(() => {
    sendMessage("session", "ping");
});

function handleSessionMessage(msg) {
    sessionCallbacks[msg.type]?.(msg);
}

function addAllCharacters(msg) {
    msg.chars.forEach(async c => {
        if (!(c.name in characters)) {
            await addFullSheet(slugify(c.name));
        }
        await updateCharacter(new SessionCharacter(c));
    });
}
sessionCallbacks["chardata"] = addAllCharacters;

function handleSessionEnd() {
    let element = document.getElementById("characters");
    element.innerHTML = "";
    characters = {};
    handleNoSession();
}
sessionCallbacks["end"] = handleSessionEnd;

function handleNoSession() {
    sendMessage("session", "charnames");
}
sessionCallbacks["nosession"] = handleNoSession;

function handleNoSessionCharacters(msg) {
    let characterNames = msg.charNames;

    const noSessionHTML = `
    <span>No session is currently active.</span>
    <span class="dm-only"><br><br>Would you like to start one?</span>
    <div class="dm-only" id="dm-char-list">
    ${characterNames.map(name => `
        <input type="checkbox" data-name="${name}" id="session-${name}">
        <label for="session-${name}">${name}</label>`).join("<br>")}
        </div>
        <button class="dm-only" onclick="startSessionButton()">Begin</button>`;

    let element = document.createElement("div");
    element.classList.add("box");
    element.id = "no-session";
    element.innerHTML = noSessionHTML;
    charactersElement.append(element);
}
sessionCallbacks["charnames"] = handleNoSessionCharacters;

function startSessionButton() {
    let charList = document.getElementById("dm-char-list");
    let selectedChars = [...charList.querySelectorAll("input:checked")].map(e => `"${e.dataset.name}"`);
    sendConsoleCommand(`session new ${selectedChars.join(" ")}`);
    // sendMessage("session", "start", { chars: selectedChars });
}

function startSession() {
    document.getElementById("no-session")?.remove();
    sendMessage("session", "chardata");
}
sessionCallbacks["start"] = startSession;

function handleUpdateMessage(msg) {

}


function handleNewTurn(msg) {
    addAllCharacters(msg);
}
sessionCallbacks["turn"] = handleNewTurn;

messageCallbacks["session"] = handleSessionMessage;
