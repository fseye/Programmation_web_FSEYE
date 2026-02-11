import type { Event } from "../utils/types";

// GET tous les events
export async function fetchAllEvents(): Promise<Event[]> {
  const token = localStorage.getItem("token");
  const res = await fetch("/api/events", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return [];

  const data = await res.json();
  return Array.isArray(data) ? data : data.events ?? [];
}

// GET mes events
export async function fetchMyEvents(): Promise<Event[]> {
  const token = localStorage.getItem("token");
  const res = await fetch("/api/events/mine", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : data.events ?? [];
}

// POST créer un event
export async function createEvent(
  title: string,
  description: string,
  eventDate: string,
  location: string,
  maxSubscribers: number,
  category: string,
  imageUrl?: string
) {
  const token = localStorage.getItem("token");
  const res = await fetch("/api/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title,
      description,
      event_date: eventDate,
      location,
      max_subscribers: maxSubscribers,
      category,
      image_url: imageUrl,
    }),
  });

  if (!res.ok) throw new Error("Create failed");
  return res.json();
}

// DELETE event
export async function deleteEvent(id: number): Promise<void> {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/events/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to delete event");
}

// POST subscribe to event
export async function subscribeEvent(eventId: number) {
  const token = localStorage.getItem("token");

  const res = await fetch(`/api/events/${eventId}/subscribe`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Subscribe failed");
}

// DELETE unsubscribe from event
export async function unsubscribeEvent(eventId: number) {
  const token = localStorage.getItem("token");

  const res = await fetch(`/api/events/${eventId}/subscribe`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Unsubscribe failed");
}

// PUT update event
export async function updateEvent(
  id: number,
  title: string,
  description: string,
  event_date: string,
  location: string,
  max_subscribers: number,
  category: string,
  imageUrl?: string
) {
  const token = localStorage.getItem("token");

  const res = await fetch(`/api/events/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title,
      description,
      event_date,
      location,
      max_subscribers,
      category,
      image_url: imageUrl,
    }),
  });

  if (!res.ok) throw new Error("Update failed");
  return res.json();
}

// GET event subscribers
export async function fetchEventSubscribers(eventId: number) {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/events/${eventId}/subscribers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch subscribers");
  return res.json();
}

// POST duplicate event
export async function duplicateEventAPI(eventId: number) {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/events/${eventId}/duplicate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Duplicate failed");
  return res.json();
}