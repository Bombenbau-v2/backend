import type {MalformedHash, MissingFields, NoSpecialCharacters, TagUsed} from "./error.ts";
import type {Hash} from "./misc.ts";

export type RegisterRequest = {
	name: string;
	tag: string;
	password: Hash;
};

export type RegisterResponse = {
	success: boolean;
	error?: MissingFields | TagUsed | NoSpecialCharacters | MalformedHash;
};
