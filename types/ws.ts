export type SocketRequest = {
	request: "/login";
	data: LoginRequest;
};

export type LoginRequest = {
	tag: string;
	password: string;
};

export type LoginResponse = {
	success: boolean;
	error?: "user_not_found" | "malformed_hash" | "wrong_password" | "missing_fields";
};
