class RunCharacter {
    static baseStats = {
        "hp": 10,
        "mp": 10,
        "strength": 5,
        "magic": 5,
        "defense": 5,
        "resistance": 5,
    };

    constructor(fullCharacter) {
        this.full = fullCharacter;
        this.currentHP = this.maxHP;
        this.currentMP = this.maxMP;
    }

    full = null;

    getStat(stat) {
        return RunCharacter.baseStats[stat] +
            this.full?.specialtyClass[stat] +
            (this.equippedClass == null ? 0 : this.equippedClass[stat]);
    }

    get maxHP() { return this.getStat("hp"); }
    get maxMP() { return this.getStat("mp"); }
    get strength() { return this.getStat("strength"); }
    get magic() { return this.getStat("magic"); }
    get defense() { return this.getStat("defense"); }
    get resistance() { return this.getStat("resistance"); }

    get name() { return this.full.name; }
    get pronouns() { return this.full.pronouns; }
    get species() { return this.full.species; }
    get player() { return this.full.player; }
    get image() { return this.full.image; }
    get specialtyClass() { return this.full.specialtyClass; }

    currentHP;
    currentMP;
    equippedClass = null;
    buffs = ["str-up", "mag-down"];
}
