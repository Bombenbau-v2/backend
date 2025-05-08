import type {RegisterRequest, RegisterResponse} from "./types/http.ts";
import type {LoginRequest, ChangeDisplayNameRequest, ChangeTagRequest, UserExistByTagRequest, SendMessageRequest, ListConversationsRequest, SocketRequest} from "./types/ws.ts";
import type {UserName, UserTag} from "./types/misc.ts";
import {hash} from "./ext/hash.ts";

// Initialize socket
const socket = new WebSocket("ws://localhost:6969");

socket.addEventListener("open", () => {
	console.log("Connected to server");
});

socket.addEventListener("message", (event) => {
	try {
		console.log("Received message:", JSON.parse(event.data));
	} catch {
		console.log("Received message:", event.data);
	}
});

socket.addEventListener("close", () => {
	console.log("Disconnected from server");
});

socket.addEventListener("error", (error) => {
	console.error("WebSocket error:", error);
});

export const clearUsers = async (): Promise<void> => {
	await fetch("http://localhost:6969/clear_users", {
		method: "POST",
	});
};

export const clearConversations = async (): Promise<void> => {
	await fetch("http://localhost:6969/clear_conversations", {
		method: "POST",
	});
};

export const clearAll = async (): Promise<void> => {
	await clearUsers();
	await clearConversations();
};

export const register = async (name: UserName, tag: UserTag, password: string): Promise<RegisterResponse> => {
	const data: RegisterRequest = {
		name,
		tag,
		password: await hash(password),
	};

	return await (
		await fetch("http://localhost:6969/register", {
			method: "POST",
			body: JSON.stringify(data),
		})
	).json();
};

export const login = async (tag: UserTag, password: string): Promise<void> => {
	const request: LoginRequest = {
		tag,
		password: await hash(password),
	};

	socket.send(
		JSON.stringify({
			request: "/login",
			data: request,
		} as SocketRequest)
	);
};

export const changeDisplayName = (name: UserName): void => {
	const request: ChangeDisplayNameRequest = {
		name,
	};

	socket.send(
		JSON.stringify({
			request: "/change_display_name",
			data: request,
		} as SocketRequest)
	);
};

export const changeTag = (tag: UserTag): void => {
	const request: ChangeTagRequest = {
		tag,
	};

	socket.send(
		JSON.stringify({
			request: "/change_tag",
			data: request,
		} as SocketRequest)
	);
};

export const userExistByTag = (tag: UserTag): void => {
	const request: UserExistByTagRequest = {
		tag,
	};

	socket.send(
		JSON.stringify({
			request: "/user_exist_by_tag",
			data: request,
		} as SocketRequest)
	);
};

export const sendMessage = (text: string, uuid: string, recipient: UserTag): void => {
	const request: SendMessageRequest = {
		text,
		uuid,
		recipient,
	};

	socket.send(
		JSON.stringify({
			request: "/send_message",
			data: request,
		} as SocketRequest)
	);
};

export const listConversations = (): void => {
	const request: ListConversationsRequest = {};

	socket.send(
		JSON.stringify({
			request: "/list_conversations",
			data: request,
		} as SocketRequest)
	);
};
