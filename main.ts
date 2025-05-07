import {checkHash} from "./ext/hash.ts";
import type {RegisterRequest, RegisterResponse} from "./types/http.ts";
import type {Session, User} from "./types/misc.ts";
import type {ChangeDisplayNameRequest, ChangeDisplayNameResponse, ChangeTagRequest, ChangeTagResponse, LoginRequest, LoginResponse, SocketRequest, type UserExistByTagRequest, type UserExistByTagResponse} from "./types/ws.ts";
import * as regex from "./ext/regex.ts";

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

const loadData = () => {
	try {
		const data: {users: User[]; sessions: Session[]} = JSON.parse(Deno.readTextFileSync("data.json"));

		for (const user of data.users) users.push(user);
	} catch (error) {
		console.error("Failed to load data: " + error);
	}
};

loadData();

Deno.serve({port: 6969}, async (req: Request) => {
	// WebSocket server
	if (req.headers.get("upgrade") === "websocket") {
		const {socket, response} = Deno.upgradeWebSocket(req);

		socket.addEventListener("open", () => {
			console.log("Client connected");

			const session: Session = {};

			socket.addEventListener("close", () => {
				console.log("Client disconnected");

				// Remove the session from the sessions array
				const index = sessions.indexOf(session);
				if (index !== -1) {
					sessions.splice(index, 1);
				}
			});

			socket.addEventListener("message", (event) => {
				const request: SocketRequest = safeJSONParse(event.data);

				if ((request as unknown as JSONParseError) === "JSON_PARSE_ERROR") {
					return socket.send("invalid_json");
				}

				console.log("I ->", request);

				// Ensure request structure
				if (!request.request || !request.data) {
					return socket.send("malformed_request");
				}

				// Reject if unauthorized and not trying to login
				if (!session.user && request.request !== "/login") return socket.send("unauthorized");

				if (request.request === "/login") {
					const data = request.data as unknown as LoginRequest;

					// Ensure required fields
					if (!data.tag || !data.password) {
						const response: LoginResponse = {concern: "login", success: false, error: "missing_fields"};

						return socket.send(JSON.stringify(response));
					}

					// Check if there is a user with the provided tag
					const user = users.find((user) => user.tag === data.tag);
					if (!user) {
						const response: LoginResponse = {concern: "login", success: false, error: "user_not_found"};

						return socket.send(JSON.stringify(response));
					}

					// Check if the password is actually a hash
					if (!checkHash(data.password)) {
						const response: LoginResponse = {concern: "login", success: false, error: "malformed_hash"};

						return socket.send(JSON.stringify(response));
					}

					// Check if the password is correct
					if (user.password !== data.password) {
						const response: LoginResponse = {concern: "login", success: false, error: "wrong_password"};

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

					// Ensure name length is between 3 and 16 characters
					if (data.name.length < 3 || data.name.length > 16) {
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

					// Check if the tag doesn't contain any special characters (just a-z0-9-_)
					if (!regex.TAG.test(data.tag)) {
						const response: ChangeTagResponse = {concern: "change_tag", success: false, error: "no_special_characters"};

						return socket.send(JSON.stringify(response));
					}

					// Ensure tag length is between 3 and 16 characters
					if (data.tag.length < 3 || data.tag.length > 16) {
						const response: ChangeTagResponse = {concern: "change_tag", success: false, error: "invalid_tag_length"};

						return socket.send(JSON.stringify(response));
					}

					// Check if there is a user with the same tag
					if (users.some((user) => user.tag === data.tag)) {
						const response: ChangeTagResponse = {concern: "change_tag", success: false, error: "tag_used"};

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

					// Check if there is a user with the provided tag
					const user = users.find((user) => user.tag === data.tag);

					// Send response
					const response: UserExistByTagResponse = {
						concern: "user_exist_by_tag",
						success: true,
						exists: user !== undefined,
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
		if (req.method === "OPTIONS") return new Response("ok", {status: 200, headers});
		if (req.method !== "POST") return new Response("Method not allowed", {status: 405});
		const data: RegisterRequest = await safeJSONParse(await req.text());

		if ((data as unknown as JSONParseError) === "JSON_PARSE_ERROR") return new Response("Invalid JSON", {status: 400, headers});

		// Check if the request has all the required fields
		if (!data.name || !data.tag || !data.password) {
			const response: RegisterResponse = {success: false, error: "missing_fields"};
			return new Response(JSON.stringify(response), {status: 400, headers});
		}

		// Check if there is a user with the same tag
		if (users.some((user) => user.tag === data.tag)) {
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

		users.push({
			name: data.name,
			tag: data.tag,
			password: data.password,
		});

		return new Response(JSON.stringify({success: true} as RegisterResponse));
	} else
		return new Response("404 Not Found", {
			status: 404,
			headers,
		});
});

while (true) {
	Deno.writeTextFileSync("data.json", JSON.stringify({users, sessions}, null, 6));
	await new Promise((resolve) => setTimeout(resolve, 1000));
}
