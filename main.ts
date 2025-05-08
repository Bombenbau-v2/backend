import {checkHash} from "./ext/hash.ts";
import type {RegisterRequest, RegisterResponse} from "./types/http.ts";
import type {ClientConversation, Conversation, Session, User} from "./types/misc.ts";
import type {ChangeDisplayNameRequest, ChangeDisplayNameResponse, ChangeTagRequest, ChangeTagResponse, ListConversationsRequest, ListConversationsResponse, LoginRequest, LoginResponse, SendMessageRequest, SendMessageResponse, SocketRequest, UserExistByTagRequest, UserExistByTagResponse} from "./types/ws.ts";
import * as regex from "./ext/regex.ts";
import {ENABLE_DEV_ROUTES, MESSAGE_LENGTH_MAX, SERVER_PORT, USER_NAME_LENGTH_MAX, USER_NAME_LENGTH_MIN, USER_TAG_LENGTH_MAX, USER_TAG_LENGTH_MIN} from "./config.ts";
import * as findUser from "./ext/find_user.ts";

type JSONParseError = "JSON_PARSE_ERROR";

// deno-lint-ignore no-explicit-any
const safeJSONParse = (text: string, logError?: boolean): JSONParseError | any => {
	try {
		return JSON.parse(text);
	} catch (error) {
		if (logError) console.error("Failed to parse JSON body:", error);
		return "JSON_PARSE_ERROR" as JSONParseError;
	}
};

const users: User[] = [];
const sessions: Session[] = [];
const conversations: Conversation[] = [];

const loadData = () => {
	try {
		const data: {users: User[]; sessions: Session[]; conversations: Conversation[]} = JSON.parse(Deno.readTextFileSync("data.json"));

		for (const user of data.users) users.push(user);
		for (const conversation of data.conversations) conversations.push(conversation);
	} catch (error) {
		console.error("Failed to load data: " + error);
	}
};

loadData();

Deno.serve({port: SERVER_PORT}, async (req: Request) => {
	// WebSocket server
	if (req.headers.get("upgrade") === "websocket") {
		const {socket, response} = Deno.upgradeWebSocket(req);

		socket.addEventListener("open", () => {
			console.log("\x1b[90mClient connected\x1b[0m");

			const session: Session = {};

			const deauthorizeUser = () => {
				console.log("\x1b[90mClient disconnected\x1b[0m");

				// Remove the session from the sessions array
				const index = sessions.indexOf(session);
				if (index !== -1) {
					sessions.splice(index, 1);
				}
			};

			socket.addEventListener("close", deauthorizeUser);

			socket.addEventListener("message", (event) => {
				const request: SocketRequest = safeJSONParse(event.data);

				if ((request as unknown as JSONParseError) === "JSON_PARSE_ERROR") {
					return socket.send("invalid_json");
				}

				// Ensure request structure
				if (!request.request || !request.data) {
					return socket.send("malformed_request");
				}

				// Reject if unauthorized and not trying to login
				if (!session.user && request.request !== "/login") return socket.send("unauthorized");

				if (request.request === "/login") {
					const data = request.data as unknown as LoginRequest;

					// If the user is already logged in, deauthorize them
					if (session.user) {
						console.log("deauthorizing user " + session.user.tag);
						deauthorizeUser();
					}

					// Ensure required fields
					if (!data.tag || !data.password) {
						const response: LoginResponse = {concern: "login", success: false, error: "missing_fields"};

						return socket.send(JSON.stringify(response));
					}

					// Check if there is a user with the provided tag
					const user = findUser.byID(users, data.tag);
					if (!user) {
						const response: LoginResponse = {concern: "login", success: false, error: "user_not_found"};

						return socket.send(JSON.stringify(response));
					}

					// Check if the password is correct
					if (user.password !== data.password) {
						const response: LoginResponse = {concern: "login", success: false, error: "wrong_password"};

						return socket.send(JSON.stringify(response));
					}

					// Check if the password is actually a hash
					if (!checkHash(data.password)) {
						const response: LoginResponse = {concern: "login", success: false, error: "malformed_hash"};

						return socket.send(JSON.stringify(response));
					}

					// Create user reference in session object
					session.user = user;
					sessions.push(session);

					// Send response
					const response: LoginResponse = {concern: "login", success: true};

					socket.send(JSON.stringify(response));
				} else if (request.request === "/change_display_name") {
					const data = request.data as unknown as ChangeDisplayNameRequest;

					// Ensure required fields
					if (!data.name) {
						const response: ChangeDisplayNameResponse = {concern: "change_display_name", success: false, error: "missing_fields"};

						return socket.send(JSON.stringify(response));
					}

					// Check if the name contains any special characters (just a-z0-9-_)
					if (!regex.NAME.test(data.name)) {
						const response: ChangeDisplayNameResponse = {concern: "change_display_name", success: false, error: "no_special_characters"};

						return socket.send(JSON.stringify(response));
					}

					// Ensure name length is in bounds
					if (data.name.length < USER_NAME_LENGTH_MIN || data.name.length > USER_NAME_LENGTH_MAX) {
						const response: ChangeDisplayNameResponse = {concern: "change_display_name", success: false, error: "invalid_name_length"};

						return socket.send(JSON.stringify(response));
					}

					// Update the user's name in the session object
					session.user!.name = data.name;

					// Send response
					const response: ChangeDisplayNameResponse = {concern: "change_display_name", success: true};

					socket.send(JSON.stringify(response));
				} else if (request.request === "/change_tag") {
					const data = request.data as unknown as ChangeTagRequest;

					// Ensure required fields
					if (!data.tag) {
						const response: ChangeTagResponse = {concern: "change_tag", success: false, error: "missing_fields"};

						return socket.send(JSON.stringify(response));
					}

					// Check if there is a user with the same tag
					if (findUser.byID(users, data.tag)) {
						const response: ChangeTagResponse = {concern: "change_tag", success: false, error: "tag_used"};

						return socket.send(JSON.stringify(response));
					}

					// Check if the tag doesn't contain any special characters (just a-z0-9-_)
					if (!regex.TAG.test(data.tag)) {
						const response: ChangeTagResponse = {concern: "change_tag", success: false, error: "no_special_characters"};

						return socket.send(JSON.stringify(response));
					}

					// Ensure tag length is between 3 and 16 characters
					if (data.tag.length < USER_TAG_LENGTH_MIN || data.tag.length > USER_TAG_LENGTH_MAX) {
						const response: ChangeTagResponse = {concern: "change_tag", success: false, error: "invalid_tag_length"};

						return socket.send(JSON.stringify(response));
					}

					// Update the user's tag in the session object
					session.user!.tag = data.tag;

					// Send response
					const response: ChangeTagResponse = {concern: "change_tag", success: true};

					socket.send(JSON.stringify(response));
				} else if (request.request === "/user_exist_by_tag") {
					const data = request.data as unknown as UserExistByTagRequest;

					// Ensure required fields
					if (!data.tag) {
						const response: UserExistByTagResponse = {concern: "user_exist_by_tag", success: false, error: "missing_fields"};

						return socket.send(JSON.stringify(response));
					}

					// If the provided tag is the same as the user's tag, return an error
					if (data.tag === session.user!.tag) {
						const response: UserExistByTagResponse = {concern: "user_exist_by_tag", success: false, error: "self_not_allowed"};

						return socket.send(JSON.stringify(response));
					}

					// Check if there is a user with the provided tag
					const user = findUser.byID(users, data.tag);

					// Send response
					const response: UserExistByTagResponse = {
						concern: "user_exist_by_tag",
						success: true,
						exists: user !== undefined,
					};

					socket.send(JSON.stringify(response));
				} else if (request.request === "/send_message") {
					const data = request.data as unknown as SendMessageRequest;

					// Ensure required fields
					if (!data.text || !data.uuid || !data.recipient) {
						const response: SendMessageResponse = {concern: "send_message", success: false, error: "missing_fields"};

						return socket.send(JSON.stringify(response));
					}

					// Check if the recipient exists
					const recipient = findUser.byID(users, data.recipient);
					if (!recipient) {
						const response: SendMessageResponse = {concern: "send_message", success: false, error: "user_not_found"};

						return socket.send(JSON.stringify(response));
					}

					// Ensure user is not trying to message themselves
					if (session.user!.tag === recipient.tag) {
						const response: SendMessageResponse = {concern: "send_message", success: false, error: "self_not_allowed"};

						return socket.send(JSON.stringify(response));
					}

					// Ensure message length is in bounds
					if (data.text.length > MESSAGE_LENGTH_MAX) {
						const response: SendMessageResponse = {concern: "send_message", success: false, error: "message_length_exceeded"};

						return socket.send(JSON.stringify(response));
					}

					// Try to find the conversation object. If there is none, create one and add it to the conversations array
					let conversation = conversations.find((conversation) => conversation.participants.includes(session.user!.id) && conversation.participants.includes(recipient.id));
					if (!conversation) {
						conversation = {
							participants: [session.user?.id!, recipient.id],
							messages: [],
						};

						conversations.push(conversation);
					}

					// Add the message to the conversation object
					conversation.messages.push({
						sender: session.user!.id,
						text: data.text,
						sentAt: Date.now(),
						id: crypto.randomUUID(),
					});
				} else if (request.request === "/list_conversations") {
					const _data = request.data as unknown as ListConversationsRequest;

					// Create an array with all conversations the user is participating in
					const userConversations: ClientConversation[] = [];

					for (const conversation of conversations.filter((conversation) => conversation.participants.includes(session.user!.id))) {
						const participant = conversation.participants.find((participant) => participant !== session.user!.id);
						if (participant) {
							const user = findUser.byUUID(users, participant);
							const lastMessage = conversation.messages[conversation.messages.length - 1];
							if (user) {
								userConversations.push({
									participant: {
										name: user.name,
										tag: user.tag,
									},
									lastMessage: {
										sender: findUser.byUUID(users, lastMessage.sender)?.tag || "unknown",
										text: lastMessage.text,
										sentAt: lastMessage.sentAt,
										id: lastMessage.id,
									},
								});
							}
						}
					}


					// Send response
					const response: ListConversationsResponse = {
						concern: "list_conversations",
						success: true,
						conversations: userConversations,
					};

					socket.send(JSON.stringify(response));
				}
			});
		});

		return response;
	}

	const path = new URL(req.url).pathname;

	const headers = new Headers({
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "*",
		"Access-Control-Allow-Headers": "*",
	});

	if (path === "/register") {
		if (req.method === "OPTIONS") return new Response("", {headers});
		if (req.method !== "POST") return new Response("Method not allowed", {status: 405, headers});
		const data: RegisterRequest = await safeJSONParse(await req.text());

		if ((data as unknown as JSONParseError) === "JSON_PARSE_ERROR") return new Response("Invalid JSON", {status: 400, headers});

		// Check if the request has all the required fields
		if (!data.name || !data.tag || !data.password) {
			const response: RegisterResponse = {success: false, error: "missing_fields"};
			return new Response(JSON.stringify(response), {status: 400, headers});
		}

		// Check if there is a user with the same tag
		if (findUser.byID(users, data.tag)) {
			const response: RegisterResponse = {success: false, error: "tag_used"};

			return new Response(JSON.stringify(response), {status: 409, headers});
		}

		// Check if the tag doesn't contain any special characters (just a-z0-9-_)
		if (!regex.TAG.test(data.tag)) {
			const response: RegisterResponse = {success: false, error: "no_special_characters"};

			return new Response(JSON.stringify(response), {status: 400, headers});
		}

		// Check if the name doesn't contain any special characters (just a-z0-9-_)
		if (!regex.NAME.test(data.name)) {
			const response: RegisterResponse = {success: false, error: "no_special_characters"};

			return new Response(JSON.stringify(response), {status: 400, headers});
		}

		// The password inside of the request is already hashed. Check if the password is actually a hash
		if (!checkHash(data.password)) {
			const response: RegisterResponse = {success: false, error: "malformed_hash"};

			return new Response(JSON.stringify(response), {status: 400, headers});
		}

		// Ensure name length is in bounds
		users.push({
			name: data.name,
			tag: data.tag,
			password: data.password,
			id: crypto.randomUUID(),
		});

		return new Response(JSON.stringify({success: true} as RegisterResponse), {
			status: 200,
			headers,
		});
	} else if (path === "/avatar/blablabla") {
		return new Response(Deno.readFileSync("square.png"), {
			status: 200,
			headers,
		});
	} else if (ENABLE_DEV_ROUTES && path === "/clear_users") {
		users.length = 0;

		return new Response("Cleared users", {
			status: 200,
			headers,
		});
	} else if (ENABLE_DEV_ROUTES && path === "/clear_conversations") {
		conversations.length = 0;

		return new Response("Cleared conversations", {
			status: 200,
			headers,
		});
	} else
		return new Response("404 Not Found", {
			status: 404,
			headers,
		});
});

while (true) {
	Deno.writeTextFileSync("data.json", JSON.stringify({users, sessions, conversations}, null, 6));
	await new Promise((resolve) => setTimeout(resolve, 1000));
}
