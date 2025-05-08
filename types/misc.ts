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
	sender: UserTag;
	text: string;
}

export type Conversation = {
	participants: UUID[];
	messages: Message[];
}