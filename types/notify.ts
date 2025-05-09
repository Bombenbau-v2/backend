import type {ClientMessage, UUID} from "./misc.ts";

export type NewMessageNotification = {
	notify: "new_message";
	conversation: string;
	message: ClientMessage;
};

export type DeleteMessageNotification = {
	notify: "delete_message";
	conversation: string;
	message: UUID;
}