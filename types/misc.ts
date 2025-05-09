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
	sendQueue: string[];
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
export type ClientUser = {
	name: UserName;
	tag: UserTag;
};

export type ClientMessage = {
	sender: ClientUser;
	text: string;
	sentAt: number;
	id: UUID;
};

export type ClientConversationShort = {
	participant: ClientUser;
	lastMessage?: ClientMessage;
};

export type ClientConversation = {
	participants: ClientUser[];
	messages: ClientMessage[];
};
