import { z } from "zod";

export const EventSchema = z.object({
  title: z
    .string()
    .min(3, "Le titre doit contenir au moins 3 caractères")
    .max(100, "Le titre ne doit pas dépasser 100 caractères"),
  description: z
    .string()
    .max(500, "La description ne doit pas dépasser 500 caractères")
    .optional()
    .default(""),
  eventDate: z
    .string()
    .min(1, "La date est obligatoire")
    .refine((date) => {
      const d = new Date(date);
      return !isNaN(d.getTime());
    }, "Date invalide"),
  location: z
    .string()
    .min(2, "Le lieu doit contenir au moins 2 caractères")
    .max(100, "Le lieu ne doit pas dépasser 100 caractères"),
  maxSubscribers: z
    .number()
    .int("Doit être un nombre entier")
    .min(1, "Au moins 1 place requise")
    .max(10000, "Maximum 10000 places"),
  category: z
    .enum(["Cinéma", "Études", "Sport", "Autres"])
    .default("Autres"),
  imageUrl: z
    .string()
    .url("URL invalide")
    .optional()
    .default(""),
});

export type EventFormData = z.infer<typeof EventSchema>;