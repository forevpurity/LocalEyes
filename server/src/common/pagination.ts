export function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(
    JSON.stringify({ c: createdAt.toISOString(), i: id }),
  ).toString("base64url");
}

export function decodeCursor(cursor: string): { c: Date; i: string } {
  const raw = JSON.parse(Buffer.from(cursor, "base64url").toString("utf-8"));
  return { c: new Date(raw.c), i: raw.i };
}
