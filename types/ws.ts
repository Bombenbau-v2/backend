import type {InvalidNameLength, MalformedHash, MissingFields, NoSpecialCharacters, UserNotFound, WrongPassword, InvalidTagLength, TagUsed, SelfNotAllowed} from "./error.ts";

export type SocketRequest = {
	request: "/login" | "/change_display_name" | "/change_tag" | "/user_exist_by_tag";
	data: LoginRequest | ChangeDisplayNameRequest | ChangeTagRequest | UserExistByTagRequest;
};

// Login
export type LoginRequest = {
	tag: string;
	password: string;
};

export type LoginResponse = {
	concern: "login";
	success: boolean;
	error?: MissingFields | UserNotFound | MalformedHash | WrongPassword;
};

// Change display name
export type ChangeDisplayNameRequest = {
	name: string;
};

export type ChangeDisplayNameResponse = {
	concern: "change_display_name";
	success: boolean;
	error?: MissingFields | InvalidNameLength | NoSpecialCharacters;
};

// Change tag
export type ChangeTagRequest = {
	tag: string;
};

export type ChangeTagResponse = {
	concern: "change_tag";
	success: boolean;
	error?: MissingFields | TagUsed | NoSpecialCharacters | InvalidTagLength;
};

// User exist by tag
export type UserExistByTagRequest = {
	tag: string;
};

export type UserExistByTagResponse = {
	concern: "user_exist_by_tag";
	success: boolean;
	exists?: boolean;
	error?: MissingFields | SelfNotAllowed;
};
