import type { Database, MeetingStatus } from "./database"

export type Meeting = Database["public"]["Tables"]["meetings"]["Row"]
export type MeetingInsert = Database["public"]["Tables"]["meetings"]["Insert"]
export type { MeetingStatus }
