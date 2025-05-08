export type Hash = string;
export type UUID = string;
export type UserName = string;
export type UserTag = string;

export type User = {
	name: UserName;
	tag: UserTag;
	password: Hash;
	id: UUID;
};

export type Session = {
	user?: User;
};

export type Message = {
	sender: UUID;
	text: string;
	sentAt: number;
	id: UUID;
};

export type Conversation = {
	participants: UUID[];
	messages: Message[];
};

// Modified types for client-side usage only
export type ClientMessage = {
	sender: UserTag;
	text: string;
	sentAt: number;
	id: UUID;
};

export type ClientConversationShort = {
	participant: {
		name: UserName;
		tag: UserTag;
	};
	lastMessage: ClientMessage;
};

export type ClientConversation = {
	participants: UserTag[];
	messages: ClientMessage[];
};
