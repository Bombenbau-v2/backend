import {encodeHex} from "jsr:@std/encoding/hex";
import * as regex from "./regex.ts";

export const hash = async (input: string): Promise<string> => {
	return encodeHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input))).toUpperCase();
};

// Create a function that checks if the alleged hash is actually a hash
export const checkHash = (input: string): boolean => {
	return regex.hash.test(input);
}