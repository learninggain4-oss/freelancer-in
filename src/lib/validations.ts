import { z } from "zod";

export const registrationSchema = z.object({
  // Personal Information
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  gender: z.enum(["male", "female", "other"], { required_error: "Please select gender" }),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  marital_status: z.enum(["single", "married", "divorced", "widowed"], { required_error: "Please select marital status" }),
  education_level: z.string().min(1, "Education level is required").max(100),

  // Contact Details
  mobile_number: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  whatsapp_number: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit WhatsApp number"),
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters"),

  // Professional
  previous_job_details: z.string().max(500).optional(),
  work_experience: z.string().max(500).optional(),
  education_background: z.string().max(500).optional(),

  // Emergency Contact
  emergency_contact_name: z.string().trim().min(2, "Name is required").max(100),
  emergency_contact_relationship: z.string().min(1, "Relationship is required").max(50),
  emergency_contact_phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit phone number"),
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;

export const loginSchema = z.object({
  full_name: z.string().trim().min(2, "Name is required"),
  user_code: z.string().trim().min(1, "User code is required"),
  email: z.string().trim().email("Enter a valid email"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
