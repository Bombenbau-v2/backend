import type {InvalidNameLength, MalformedHash, MissingFields, NoSpecialCharacters, UserNotFound, WrongPassword, InvalidTagLength, TagUsed, SelfNotAllowed, MessageLengthExceeded, ConversationNotFound, MessageNotFound} from "./error.ts";
import type {ClientConversation, ClientConversationShort, ClientUser, Hash, UserName, UserTag, UUID} from "./misc.ts";

export type SocketRequest = {
	request: "/login" | "/change_display_name" | "/change_tag" | "/user_exist_by_tag" | "/send_message" | "/list_conversations" | "/get_conversation" | "/delete_message";
	data: LoginRequest | ChangeDisplayNameRequest | ChangeTagRequest | UserExistByTagRequest | SendMessageRequest | ListConversationsRequest | GetConversationRequest | DeleteMessageRequest;
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
	user?: ClientUser;
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

// Delete message
export type DeleteMessageRequest = {
	recipient: UserTag;
	messageId: UUID;
};

export type DeleteMessageResponse = {
	concern: string; // "delete_message+uuid"
	success: boolean;
	error?: MissingFields | UserNotFound | SelfNotAllowed | ConversationNotFound | MessageNotFound;
};

// List conversations
export type ListConversationsRequest = Record<never, never>;

export type ListConversationsResponse = {
	concern: "list_conversations";
	success: boolean;
	conversations: ClientConversationShort[];
};

// Get conversation
export type GetConversationRequest = {
	recipient: UserTag;
	limit?: number;
	before?: UUID;
};

export type GetConversationResponse = {
	concern: "get_conversation";
	success: boolean;
	conversation?: ClientConversation;
	error?: MissingFields | UserNotFound | SelfNotAllowed | ConversationNotFound;
};
