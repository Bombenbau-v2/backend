export type Hash = string;

export type User = {
	name: string;
	tag: string;
	password: Hash;
};

export type Session = {
	user?: User;
};
