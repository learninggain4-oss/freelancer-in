import { z } from "zod";

const phoneRegex = /^[6-9]\d{9}$/;

export const personalInfoSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  gender: z.enum(["male", "female", "other"], { required_error: "Select gender" }),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  marital_status: z.enum(["single", "married", "divorced", "widowed"], { required_error: "Select marital status" }),
  education_level: z.string().min(1, "Education level is required").max(100),
});

export const contactInfoSchema = z.object({
  mobile_number: z.string().regex(phoneRegex, "Enter a valid 10-digit Indian mobile number"),
  whatsapp_number: z.string().regex(phoneRegex, "Enter a valid 10-digit WhatsApp number"),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

export const professionalInfoSchema = z.object({
  previous_job_details: z.string().max(500).optional().or(z.literal("")),
  work_experience: z.string().max(500).optional().or(z.literal("")),
  education_background: z.string().max(500).optional().or(z.literal("")),
});

export const emergencyContactSchema = z.object({
  emergency_contact_name: z.string().trim().min(2, "Name is required").max(100),
  emergency_contact_phone: z.string().regex(phoneRegex, "Enter a valid 10-digit number"),
  emergency_contact_relationship: z.string().min(1, "Relationship is required").max(50),
});

export const fullRegistrationSchema = personalInfoSchema
  .merge(contactInfoSchema)
  .merge(professionalInfoSchema)
  .merge(emergencyContactSchema);

export type RegistrationFormData = z.infer<typeof fullRegistrationSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
