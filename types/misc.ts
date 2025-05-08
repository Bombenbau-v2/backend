export type Hash = string;
export type UUID = string;
export type UserName = string;
export type UserTag = string;

export type User = {
	name: UserName;
	tag: UserTag;
	uuid: UUID;
	password: Hash;
};

export type Session = {
	user?: User;
};

export type Message = {
	sender: UUID;
	text: string;
};

export type Conversation = {
	participants: UUID[];
	messages: Message[];
};

// Modified types for client-side usage only
export type ClientConversation = {
	participant: {
		name: UserName;
		tag: UserTag;
	};
	lastMessage: Message;
};
