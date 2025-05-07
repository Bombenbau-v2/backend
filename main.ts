import {checkHash} from "./methods/hash.ts";
import type {RegisterRequest, RegisterResponse} from "./types/http.ts";
import type {Session, User} from "./types/misc.ts";
import type {LoginRequest, LoginResponse, SocketRequest} from "./types/ws.ts";

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
				console.log("Client disconnected\n\n");

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

				// Check if the request follows the base structure
				if (!request.request || !request.data) {
					return socket.send("malformed_request");
				}

				if (request.request === "/login") {
					const data: LoginRequest = request.data;

					// Check if the request has all the required fields
					if (!data.tag || !data.password) {
						return socket.send(JSON.stringify({success: false, error: "missing_fields"} as LoginResponse));
					}

					// Check if there is a user with the provided tag
					const user = users.find((user) => user.tag === data.tag);
					if (!user) {
						return socket.send(JSON.stringify({success: false, error: "user_not_found"} as LoginResponse));
					}

					// Check if the password is actually a hash
					if (!checkHash(data.password)) {
						return socket.send(JSON.stringify({success: false, error: "malformed_hash"} as LoginResponse));
					}

					// Check if the password is correct
					if (user.password !== data.password) {
						return socket.send(JSON.stringify({success: false, error: "wrong_password"} as LoginResponse));
					}

					// Save the login info to the session object
					session.user = user;
					sessions.push(session);

					socket.send(JSON.stringify({success: true} as LoginResponse));
				}
			});
		});

		return response;
	}

	const path = new URL(req.url).pathname;

	if (path === "/register") {
		if (req.method !== "POST") return new Response("Method not allowed", {status: 405});
		const requestData: RegisterRequest = await safeJSONParse(await req.text());

		if ((requestData as unknown as JSONParseError) === "JSON_PARSE_ERROR") return new Response("Invalid JSON", {status: 400});

		// Check if the request has all the required fields
		if (!requestData.name || !requestData.tag || !requestData.password) {
			return new Response(JSON.stringify({success: false, error: "missing_fields"} as RegisterResponse), {status: 400});
		}

		// Check if there is a user with the same tag
		if (users.some((user) => user.tag === requestData.tag)) {
			return new Response(JSON.stringify({success: false, error: "tag_used"} as RegisterResponse), {status: 409});
		}

		// Check if the tag doesn't contain any special characters (just a-z0-9-_)
		if (!/^[a-zA-Z0-9-_]+$/.test(requestData.tag)) {
			return new Response(JSON.stringify({success: false, error: "no_special_characters"} as RegisterResponse), {status: 400});
		}

		// Remove all "dangerous" characters from the name (e.g. <>, /, \, etc.)
		const sanitizedName = requestData.name.replace(/[^a-zA-Z0-9-_ ]/g, "");

		// The password inside of the request is already hashed. Check if the password is actually a hash
		if (!checkHash(requestData.password)) {
			return new Response(JSON.stringify({success: false, error: "invalid_hash"} as RegisterResponse), {status: 400});
		}

		users.push({
			name: sanitizedName,
			tag: requestData.tag,
			password: requestData.password,
		});

		return new Response(JSON.stringify({success: true} as RegisterResponse));
	} else
		return new Response("404 Not Found", {
			status: 404,
		});
});

while (true) {
	Deno.writeTextFileSync("data.json", JSON.stringify({users, sessions}, null, 6));
	await new Promise((resolve) => setTimeout(resolve, 1000));
}
