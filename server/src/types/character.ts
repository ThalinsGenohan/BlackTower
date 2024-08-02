import { readFile } from 'node:fs/promises';

export class PronounList {
    subject: String = "they";
    object: String = "them";
    possessiveSubject: String = "their";
    possessiveObject: String = "theirs";
    reflexive: String = "themself";
}

export class Skill {
    name: string = "";
    description: string = "";
    mpCost: number = 0;
}

export class JobClass {
    name: string = "";
    description: string = "";
    hp: number = 0;
    mp: number = 0;
    strength: number = 0;
    magic: number = 0;
    defense: number = 0;
    resistance: number = 0;
    skills: Array<Skill> = [];
}

export class Character {
    static get baseHP(): number {
        return 10;
    }
    static get baseMP(): number {
        return 10;
    }
    static get baseStrength(): number {
        return 5;
    }
    static get baseMagic(): number {
        return 5;
    }
    static get baseDefense(): number {
        return 5;
    }
    static get baseResistance(): number {
        return 5;
    }

    name: string = "";
    pronouns: PronounList = new PronounList();
    species: string = "";
    player: string = "";
    biography: string = "";
    image: string = "";
    runsWon: number = 0;
    runsPlayed: number = 0;
    specialtyClass: JobClass = new JobClass();

    static async load(name: String) {
        let file: string = await readFile(`characters/${name}`, { encoding: 'utf-8' });
        let character: Character = JSON.parse(file);
        return character;
    }
}
