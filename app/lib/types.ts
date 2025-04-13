export type Role = string & ("user" | "assistant" | "system");

export interface ChatHistoryItem {
  role: Role;
  content: string;
}
