export const quoteKeys = { all: ["quotes"] as const, submission: (id: string) => ["quotes", "submission", id] as const };

