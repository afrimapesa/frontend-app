// Shared by the server page and the client component, so it must not be a "use client"
// module: values exported from one arrive on the server as client references.

import type { CompareResponse } from "./api";

export const DEFAULT_SEND = "GB";
export const DEFAULT_RECEIVE = "NG";
export const DEFAULT_AMOUNT = "200";
export const MAX_AMOUNT = 1_000_000;

/** Identifies one comparison request; the server and browser must build it the same way. */
export function compareKey(send: string, receive: string, amount: string) {
  return `${send}-${receive}-${amount}`;
}

export type LoadedComparison = {
  key: string;
  data: CompareResponse;
  fetchedAt: number; // ms epoch, fixed per response so ages render identically everywhere
};
