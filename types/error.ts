// Basic errors
export type MissingFields = "missing_fields";

// User database
export type UserNotFound = "user_not_found";
export type SelfNotAllowed = "self_not_allowed";
export type WrongPassword = "wrong_password";
export type TagUsed = "tag_used";

// Special characters
export type NoSpecialCharacters = "no_special_characters";

// Invalid length
export type InvalidNameLength = "invalid_name_length";
export type InvalidTagLength = "invalid_tag_length";
export type MessageLengthExceeded = "message_length_exceeded";

// Miscellaneous
export type MalformedHash = "malformed_hash";
export type ConversationNotFound = "conversation_not_found";