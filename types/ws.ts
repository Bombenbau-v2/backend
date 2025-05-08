import type {InvalidNameLength, MalformedHash, MissingFields, NoSpecialCharacters, UserNotFound, WrongPassword, InvalidTagLength, TagUsed, SelfNotAllowed, MessageLengthExceeded} from "./error.ts";
import type {ClientConversation, Hash, UserName, UserTag, UUID} from "./misc.ts";

export type SocketRequest = {
	request: "/login" | "/change_display_name" | "/change_tag" | "/user_exist_by_tag" | "/send_message" | "/list_conversations";
	data: LoginRequest | ChangeDisplayNameRequest | ChangeTagRequest | UserExistByTagRequest | SendMessageRequest | ListConversationsRequest;
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
	text: string;
	uuid: UUID;
	recipient: UserTag;
};

export type SendMessageResponse = {
	concern: string; // "send_message+uuid"
	success: boolean;
	error?: MissingFields | UserNotFound | SelfNotAllowed | MessageLengthExceeded;
};

// List conversations
export type ListConversationsRequest = Record<never, never>;

export type ListConversationsResponse = {
	concern: "list_conversations";
	success: boolean;
	conversations: ClientConversation[];
};
