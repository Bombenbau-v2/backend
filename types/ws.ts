export type SocketRequest = {
	request: "/login" | "/change_display_name" | "/change_tag";
	data: LoginRequest | ChangeDisplayNameRequest | ChangeTagRequest;
};

// Login
export type LoginRequest = {
	tag: string;
	password: string;
};

export type LoginResponse = {
	concern: "login";
	success: boolean;
	error?: "user_not_found" | "malformed_hash" | "wrong_password" | "missing_fields";
};

// Change display name
export type ChangeDisplayNameRequest = {
	name: string;
};

export type ChangeDisplayNameResponse = {
	concern: "change_display_name";
	success: boolean;
	error?: "missing_fields" | "invalid_name_length" | "no_special_characters";
};

// Change tag
export type ChangeTagRequest = {
	tag: string;
};

export type ChangeTagResponse = {
	concern: "change_tag";
	success: boolean;
	error?: "tag_used" | "no_special_characters" | "invalid_hash" | "missing_fields" | "invalid_tag_length";
};
