import { Character } from "./character";
import { SessionCharacter, Buff, Gem } from "./session-character";

export class Session {
    constructor(chars: Array<Character>) {
        console.log(`Starting new session with ${chars.length} characters.`);
        for (let c of chars) {
            this.characters.push(new SessionCharacter(c));
        }
    }

    characters: Array<SessionCharacter> = [];
}
