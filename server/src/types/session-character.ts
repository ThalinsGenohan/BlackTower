import { Character, JobClass } from 'types/character';

export class SessionCharacter {
    static baseHP = 10;
    static baseMP = 10;
    static baseStrength = 5;
    static baseMagic = 5;
    static baseDefense = 5;
    static baseResistance = 5;

    constructor(fullCharacter: Character) {
        this.full = fullCharacter;
        this.currentHP = this.maxHP;
        this.currentMP = this.maxMP;
    }

    full: Character;

    get maxHP() {
        return SessionCharacter.baseHP +
            this.full.specialtyClass.hp +
            (this.equippedClass == null ? 0 : this.equippedClass.hp);
    }
    get maxMP() {
        return SessionCharacter.baseMP +
            this.full.specialtyClass.mp +
            (this.equippedClass == null ? 0 : this.equippedClass.mp);
    }
    get strength() {
        return SessionCharacter.baseStrength +
            this.full.specialtyClass.strength +
            (this.equippedClass == null ? 0 : this.equippedClass.strength);
    }
    get magic() {
        return SessionCharacter.baseMagic +
            this.full.specialtyClass.magic +
            (this.equippedClass == null ? 0 : this.equippedClass.magic);
    }
    get defense() {
        return SessionCharacter.baseDefense +
            this.full.specialtyClass.defense +
            (this.equippedClass == null ? 0 : this.equippedClass.defense);
    }
    get resistance() {
        return SessionCharacter.baseResistance +
            this.full.specialtyClass.resistance +
            (this.equippedClass == null ? 0 : this.equippedClass.resistance);
    }

    get name() { return this.full.name; }
    get pronouns() { return this.full.pronouns; }
    get species() { return this.full.species; }
    get player() { return this.full.player; }
    get image() { return this.full.image; }
    get specialtyClass() { return this.full.specialtyClass; }

    currentHP: number;
    currentMP: number;
    equippedClass: JobClass | null = null;
    buffs: { [id: string]: number } = {};
}
