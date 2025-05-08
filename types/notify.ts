import type {ClientMessage} from "./misc.ts";

export type NewMessageNotification = {
	notify: "new_message";
	conversation: string;
	message: ClientMessage;
};
