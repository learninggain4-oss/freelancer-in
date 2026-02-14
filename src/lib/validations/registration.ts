import { z } from "zod";

const phoneRegex = /^[6-9]\d{9}$/;

export const personalInfoSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100)
    .transform((val) => val.toUpperCase()),
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

export const workExperienceEntrySchema = z.object({
  company_name: z.string().min(1, "Company name is required").max(200),
  company_type: z.enum(["private", "public", "government", "ngo", "freelance", "other"], { required_error: "Select company type" }),
  work_description: z.string().max(500).optional().or(z.literal("")),
  start_year: z.number().min(1970).max(new Date().getFullYear()),
  end_year: z.number().min(1970).max(new Date().getFullYear()).optional(),
  is_current: z.boolean().default(false),
  certificate_file: z.any().optional(),
});

export const professionalInfoSchema = z.object({
  education_background: z.string().max(500).optional().or(z.literal("")),
  work_experiences: z.array(workExperienceEntrySchema).optional().default([]),
});

export const emergencyContactEntrySchema = z.object({
  contact_name: z.string().trim().min(2, "Name is required").max(100),
  contact_phone: z.string().regex(phoneRegex, "Enter a valid 10-digit number"),
  relationship: z.string().min(1, "Relationship is required").max(50),
});

export const emergencyContactsSchema = z.object({
  emergency_contacts: z.array(emergencyContactEntrySchema).min(1, "At least one emergency contact is required"),
});

export const serviceEntrySchema = z.object({
  service_title: z.string().min(2, "Service title is required").max(200),
  category_id: z.string().min(1, "Select a category"),
  skill_ids: z.array(z.string()).optional().default([]),
  hourly_rate: z.number().min(0, "Must be 0 or more"),
  minimum_budget: z.number().min(0, "Must be 0 or more"),
});

export const servicesSchema = z.object({
  services: z.array(serviceEntrySchema).min(1, "Add at least one service"),
});

// Full schema for employee (with services required)
export const employeeRegistrationSchema = personalInfoSchema
  .merge(contactInfoSchema)
  .merge(professionalInfoSchema)
  .merge(emergencyContactsSchema)
  .merge(servicesSchema);

// Full schema for client (without services & professional)
export const clientRegistrationSchema = personalInfoSchema
  .merge(contactInfoSchema)
  .merge(emergencyContactsSchema)
  .extend({
    services: z.array(serviceEntrySchema).optional().default([]),
    education_background: z.string().max(500).optional().or(z.literal("")),
    work_experiences: z.array(workExperienceEntrySchema).optional().default([]),
  });

export const fullRegistrationSchema = personalInfoSchema
  .merge(contactInfoSchema)
  .merge(professionalInfoSchema)
  .merge(emergencyContactsSchema)
  .merge(servicesSchema);

export type WorkExperienceEntry = z.infer<typeof workExperienceEntrySchema>;
export type EmergencyContactEntry = z.infer<typeof emergencyContactEntrySchema>;
export type ServiceEntry = z.infer<typeof serviceEntrySchema>;
export type RegistrationFormData = z.infer<typeof fullRegistrationSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
