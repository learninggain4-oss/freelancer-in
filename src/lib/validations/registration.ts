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
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export const educationSchema = z.object({
  education_background: z.string().max(500).optional().or(z.literal("")),
});

export const registrationProfileSchema = personalInfoSchema
  .merge(contactInfoSchema)
  .merge(educationSchema);

export type RegistrationFormData = z.infer<typeof registrationProfileSchema>;

// Legacy export for backward compatibility
export const fullRegistrationSchema = registrationProfileSchema;

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Types for dynamic registration arrays
export interface WorkExperienceEntry {
  company_name: string;
  company_type: string;
  work_description: string;
  start_year: string;
  end_year: string;
  is_current: boolean;
  certificate_file: File | null;
}

export interface EmergencyContactEntry {
  contact_name: string;
  contact_phone: string;
  relationship: string;
}

export interface ServiceEntry {
  category_id: string;
  service_title: string;
  hourly_rate: string;
  minimum_budget: string;
  skill_ids: string[];
}

export const validateWorkExperience = (entry: WorkExperienceEntry): string | null => {
  if (!entry.company_name.trim()) return "Company name is required";
  if (!entry.company_type) return "Company type is required";
  if (!entry.start_year) return "Start year is required";
  if (!entry.is_current && !entry.end_year) return "End year is required (or mark as currently working)";
  if (!entry.is_current && entry.end_year && Number(entry.end_year) < Number(entry.start_year)) return "End year cannot be before start year";
  return null;
};

export const validateEmergencyContact = (entry: EmergencyContactEntry): string | null => {
  if (!entry.contact_name.trim() || entry.contact_name.trim().length < 2) return "Contact name is required (min 2 chars)";
  if (!phoneRegex.test(entry.contact_phone)) return "Enter a valid 10-digit phone number";
  if (!entry.relationship) return "Relationship is required";
  return null;
};

export const validateService = (entry: ServiceEntry): string | null => {
  if (!entry.category_id) return "Select a service category";
  if (!entry.service_title.trim()) return "Service title is required";
  if (!entry.hourly_rate || Number(entry.hourly_rate) <= 0) return "Hourly rate must be greater than 0";
  if (!entry.minimum_budget || Number(entry.minimum_budget) <= 0) return "Minimum budget must be greater than 0";
  return null;
};
