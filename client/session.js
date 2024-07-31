const charactersElement = document.getElementById("characters");
const sheetTemplate = fetch("/assets/templates/character-sheet-session.html")
    .then(sheet => sheet.text());

const skillEntryTemplate = fetch("/assets/templates/skill-list-entry.html")
    .then(entry => entry.text());

const characterCategory = "char";
let characterCallbacks = {};

async function addFullSheet(charID) {
    let template = await sheetTemplate;
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

const barImages = {
    "hp": loadImage('/assets/images/hp-bar.png'),
    "mp": loadImage('/assets/images/mp-bar.png'),
};
const barFillTexture = loadImage('/assets/images/bar-fill.png');

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
    await drawBar(ctx, 0, 0, width, current, max, barColors[bar], await loadImage(`/assets/textures/${bar}-label.png`));

    // potion counter
    await drawSegmentedBar(ctx, width - 8, 9, potionCount, 3, barColors[bar]);

    // draw the bar text
    const numPos = { x: width - 45, y: 2 };
    writeSmall(ctx, numPos.x, numPos.y, `${' '.repeat(3 - current.toString().length)}${current}/${' '.repeat(3 - max.toString().length)}${max}`);
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

connectToServer().then(() => {
    sendMessage(characterCategory, "allfull", {});
});

function handleCharacterMessage(msg) {
    console.log("character message received");
    characterCallbacks[msg.type](msg)
}

async function addAllCharacters(msg) {
    msg.chars.forEach(async c => {
        if (!(c.name in characters)) {
            await addFullSheet(slugify(c.name));
        }
        await updateCharacter(new RunCharacter(c));
    });
}
characterCallbacks["allfull"] = addAllCharacters;

function handleUpdateMessage(msg) {

}


messageCallbacks[characterCategory] = handleCharacterMessage;
