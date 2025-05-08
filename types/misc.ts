export type Hash = string;
export type UserName = string;
export type UserTag = string;

export type User = {
	name: UserName;
	tag: UserTag;
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
	participants: UserTag[];
	messages: Message[];
}