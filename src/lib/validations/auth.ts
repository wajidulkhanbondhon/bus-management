import { z } from "zod";

// Phone validation pattern for BD mobiles: 013, 014, 015, 016, 017, 018, 019 followed by 8 digits
export const BD_PHONE_REGEX = /^(?:\+88|88)?01[3-9]\d{8}$/;

export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(3, "Email is required")
    .email("Invalid email address format")
    .max(100, "Email must be less than 100 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password must be less than 128 characters"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterUserSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  full_name: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
  phone: z.string().regex(BD_PHONE_REGEX, "Please enter a valid 11-digit Bangladeshi mobile number"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z.enum(["ADMIN", "MANAGER", "OPERATOR", "STAFF", "STUDENT", "PASSENGER"]).default("STAFF"),
});

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;

export const PassengerPinSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(BD_PHONE_REGEX, "Please enter a valid 11-digit mobile number (e.g. 01700000000)"),
  pin: z
    .string()
    .trim()
    .regex(/^\d{4,6}$/, "PIN must be a 4 to 6-digit number"),
  name: z.string().trim().max(100).optional(),
});

export type PassengerPinInput = z.infer<typeof PassengerPinSchema>;

export const BookingHoldSchema = z.object({
  trip_id: z.string().min(1, "Trip ID is required"),
  seat_number: z.string().min(1, "Seat number is required").max(10),
  contact_name: z.string().trim().min(2, "Name is required"),
  contact_phone: z.string().regex(BD_PHONE_REGEX, "Valid mobile number is required"),
});

export type BookingHoldInput = z.infer<typeof BookingHoldSchema>;
