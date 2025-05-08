import type {InvalidNameLength, MalformedHash, MissingFields, NoSpecialCharacters, UserNotFound, WrongPassword, InvalidTagLength, TagUsed, SelfNotAllowed, MessageLengthExceeded} from "./error.ts";
import type {Hash, UserName, UserTag} from "./misc.ts";

export type SocketRequest = {
	request: "/login" | "/change_display_name" | "/change_tag" | "/user_exist_by_tag" | "/send_message";
	data: LoginRequest | ChangeDisplayNameRequest | ChangeTagRequest | UserExistByTagRequest | SendMessageRequest;
};

// Login
export type LoginRequest = {
	tag: UserTag;
	password: Hash;
};

export type LoginResponse = {
	concern: "login";
	success: boolean;
	error?: MissingFields | UserNotFound | MalformedHash | WrongPassword;
};

// Change display name
export type ChangeDisplayNameRequest = {
	name: UserName;
};

export type ChangeDisplayNameResponse = {
	concern: "change_display_name";
	success: boolean;
	error?: MissingFields | InvalidNameLength | NoSpecialCharacters;
};

// Change tag
export type ChangeTagRequest = {
	tag: UserTag;
};

export type ChangeTagResponse = {
	concern: "change_tag";
	success: boolean;
	error?: MissingFields | TagUsed | NoSpecialCharacters | InvalidTagLength;
};

// User exist by tag
export type UserExistByTagRequest = {
	tag: UserTag;
};

export type UserExistByTagResponse = {
	concern: "user_exist_by_tag";
	success: boolean;
	exists?: boolean;
	error?: MissingFields | SelfNotAllowed;
};

// Send message
export type SendMessageRequest = {
	messageSendId: string;
	text: string;
	recipient: UserTag;
};

export type SendMessageResponse = {
	concern: "send_message";
	messageSendId: string;
	success: boolean;
	error?: MissingFields | UserNotFound | SelfNotAllowed | MessageLengthExceeded;
};
