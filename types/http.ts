import type {MalformedHash, MissingFields, NoSpecialCharacters, TagUsed} from "./error.ts";
import type {Hash, UserName, UserTag} from "./misc.ts";

export type RegisterRequest = {
	name: UserName;
	tag: UserTag;
	password: Hash;
};

export type RegisterResponse = {
	success: boolean;
	error?: MissingFields | TagUsed | NoSpecialCharacters | MalformedHash;
};
