let fs = require('fs').promises;
let PronounList = require("./pronoun-list.js");

class Character {
    static get baseHP() {
        return 10;
    }
    static get baseMP() {
        return 10;
    }
    static get baseStrength() {
        return 5;
    }
    static get baseMagic() {
        return 5;
    }
    static get baseDefense() {
        return 5;
    }
    static get baseResistance() {
        return 5;
    }

    name = "";
    pronouns = new PronounList();
    species = "";
    player = "";
    biography = "";
    imagePath = "";

    runsWon = 0;
    runsPlayed = 0;

    // Equipment
    // Class

    static async load(name) {
        let file = await fs.readFile(`characters/${name}`)
        let character = JSON.parse(file);
        return character;
    }
}

module.exports = Character;
