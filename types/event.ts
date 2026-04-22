export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED" | "SUSPENDED";

export interface EventFormData {
  title: string;
  description: string;
  venue: string;
  address: string;
  startAt: string;
  status: EventStatus;
  imageUrl?: string;
  ticketCodes?: string; // newline-separated codes in form, stored as JSON array
}
