import type {Hash} from "./misc.ts";

export type RegisterRequest = {
	name: string;
	tag: string;
	password: Hash;
};

export type RegisterResponse = {
	success: boolean;
	error?: "tag_used" | "no_special_characters" | "invalid_hash" | "missing_fields";
};
