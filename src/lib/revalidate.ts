import { revalidatePath } from "next/cache";

export function revalidateEventPaths(eventId?: string) {
  revalidatePath("/events");
  revalidatePath("/");
  if (eventId) revalidatePath(`/events/${eventId}`);
}
