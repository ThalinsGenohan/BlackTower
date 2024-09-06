import { Character, JobClass, PronounList } from 'types/character';

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

    get maxHP(): number {
        return SessionCharacter.baseHP +
            this.full.specialtyClass.hp +
            (this.equippedClass == null ? 0 : this.equippedClass.hp);
    }
    get maxMP(): number {
        return SessionCharacter.baseMP +
            this.full.specialtyClass.mp +
            (this.equippedClass == null ? 0 : this.equippedClass.mp);
    }
    get strength(): number {
        return SessionCharacter.baseStrength +
            this.full.specialtyClass.strength +
            (this.equippedClass == null ? 0 : this.equippedClass.strength);
    }
    get magic(): number {
        return SessionCharacter.baseMagic +
            this.full.specialtyClass.magic +
            (this.equippedClass == null ? 0 : this.equippedClass.magic);
    }
    get defense(): number {
        return SessionCharacter.baseDefense +
            this.full.specialtyClass.defense +
            (this.equippedClass == null ? 0 : this.equippedClass.defense);
    }
    get resistance(): number {
        return SessionCharacter.baseResistance +
            this.full.specialtyClass.resistance +
            (this.equippedClass == null ? 0 : this.equippedClass.resistance);
    }

    get name(): string { return this.full.name; }
    get pronouns(): PronounList { return this.full.pronouns; }
    get species(): string { return this.full.species; }
    get player(): string { return this.full.player; }
    get image(): string { return this.full.image; }
    get specialtyClass(): JobClass { return this.full.specialtyClass; }

    currentHP: number;
    currentMP: number;
    equippedClass: JobClass | null = null;
    buffs: { [id: string]: number } = {};

    toJSON() {
        return { ...this.full, ...this };
    }
}

export class Buff {

}
