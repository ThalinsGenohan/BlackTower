const charactersElement = document.getElementById("characters");
const sheetTemplate = fetch("/assets/templates/character-sheet-session.html")
    .then(sheet => sheet.text());

const skillEntryTemplate = fetch("/assets/templates/skill-list-entry.html")
    .then(entry => entry.text());

let sessionCallbacks = {};

async function addFullSheet(charID) {
    let template = await sheetTemplate;
    if (charactersElement.getElementById(charID)) {
        return;
    }

    let element = document.createElement("div");
    element.id = charID;
    element.innerHTML = template.replace(/\{cID\}/g, charID);
    charactersElement.append(element);
}

async function addSkillEntry(charID, skillID) {
    let template = await skillEntryTemplate;
    let element = document.createElement("div");
    element.className = "table-item";
    element.id = `${charID}-skills-${skillID}`;
    element.innerHTML = template.replace(/\{cID\}/g, charID).replace(/\{skillName\}/g, skillID);

    let skillList = document.querySelector(`#${charID} [data-update="specialtyClass-skills"]`);
    skillList.append(element);
    return element;
}

let characters = {};

async function updateCharacter(c) {
    const cID = slugify(c.name);
    characters[cID] = c;

    let things = Object.entries(
        Object.getOwnPropertyDescriptors(
            Reflect.getPrototypeOf(c)
        )
    ).map(e => e[0]);

    for (let key of things) {
        if (typeof c[key] === "object") {
            for (let sub in c[key]) {
                if (sub == "skills") {
                    updateCharacterSkills(cID, c[key][sub]);
                    continue;
                }
                updateCharacterData(cID, `${key}-${sub}`, c[key][sub]);
            }
            continue;
        }
        updateCharacterData(cID, key, c[key]);
    }

    // TEMP
    updateBar(cID, "hp", c.currentHP - 5, c.maxHP, 2);
    updateBar(cID, "mp", c.currentMP - 15, c.maxMP, 1);
    updateClassMechanic(cID, 1);
    updateClassMechanic(cID, 2);
    updateBuffs(cID, c.buffs);

    fixCenterText();
}

const barColors = {
    hp: "#26f50a",
    mp: "#08f7ef",
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

async function updateCharacterSkills(cID, data) {
    for (let skill of data) {
        const skillID = slugify(skill.name);
        let elem = document.getElementById(`${cID}-skills-${skillID}`);
        if (elem === null) {
            await addSkillEntry(cID, skillID);
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

async function updateBuffs(cID, buffs) {
    /** @type {HTMLCanvasElement} */
    let canvas = document.getElementById(`${cID}-buffs-canvas`);
    /** @type {CanvasRenderingContext2D} */
    let ctx = canvas.getContext("2d");

    const width = canvas.width = 72;
    const height = canvas.height = 23;
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = false;

    let i = 1;
    const y = 3;
    let x = (width / 2) - (12 * buffs.length / 2);
    for (let buff of buffs) {
        ctx.drawImage(await loadImage(`/assets/images/buffs/${buff}.png`), x, y);
        writeSmall(ctx, x + 3, y + (buff.match(/-down/) ? -3 : 13), i.toString());
        x += 12;
        i++;
    }
}

connectToServer().then(() => {
    sendMessage("session", "ping");
});

function handleSessionMessage(msg) {
    sessionCallbacks[msg.type]?.(msg)
}

function addAllCharacters(msg) {
    msg.chars.forEach(async c => {
        if (!(c.name in characters)) {
            await addFullSheet(slugify(c.name));
        }
        await updateCharacter(new RunCharacter(c));
    });
}
sessionCallbacks["chardata"] = addAllCharacters;

function handleSessionEnd() {

}

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
    let selectedChars = [...charList.querySelectorAll("input:checked")].map(e => e.dataset.name);
    sendMessage("session", "start", { chars: selectedChars });
}

function startSession() {
    document.getElementById("no-session")?.remove();
    sendMessage("session", "chardata");
}
sessionCallbacks["start"] = startSession;

function handleUpdateMessage(msg) {

}


messageCallbacks["session"] = handleSessionMessage;
