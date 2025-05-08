import type {User, UserTag, UUID} from "../types/misc.ts";

export const byID = (users: User[], tag: UserTag): User | undefined => {
	return users.find((user) => user.tag === tag);
};

export const byUUID = (users: User[], uuid: UUID): User | undefined => {
	return users.find((user) => user.id === uuid);
};
