import axios from "axios";

export interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  duration: number;
  isBooked: boolean;
  guestName?: string;
  guestEmail?: string;
}

export interface CreateSlotInput {
  date: string;
  startTime: string;
  duration: number;
}

export interface BookSlotInput {
  guestName: string;
  guestEmail: string;
}

export interface BookSlotResponse {
  slot: TimeSlot;
  aiConfirmationMessage: string;
}

const API_BASE =
  (import.meta.env["VITE_API_URL"] as string | undefined) ?? "https://booking-back-gmn2.onrender.com/api";

const http = axios.create({ baseURL: API_BASE, timeout: 15000 });

export const api = {
  baseUrl: API_BASE,
  getSlots: async () => (await http.get<TimeSlot[]>("/slots")).data,
  createSlot: async (input: CreateSlotInput) => (await http.post<TimeSlot>("/slots", input)).data,
  bookSlot: async (id: string, input: BookSlotInput): Promise<BookSlotResponse> => {
    // The backend writes the confirmation message with AI, which can take ~10s on a cold start.
    const data = (await http.post(`/slots/${id}/book`, input, { timeout: 60000 })).data as Record<string, unknown>;
    // Accept { slot, aiConfirmationMessage } or a flat TimeSlot with aiConfirmationMessage.
    const { aiConfirmationMessage, slot, ...rest } = data;
    return {
      slot: (slot as TimeSlot) ?? (rest as unknown as TimeSlot),
      aiConfirmationMessage: String(aiConfirmationMessage ?? "You're booked! See you soon."),
    };
  },
};

export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "Something went wrong";
    const m = (err.response.data as { message?: string | string[] })?.message;
    return Array.isArray(m) ? m.join(", ") : m ?? `Request failed (${err.response.status})`;
  }
  return err instanceof Error ? err.message : "Something went wrong";
}
