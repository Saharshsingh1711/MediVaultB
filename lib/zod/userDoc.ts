import { z } from "zod";
import { profilePictureMaxSizeBytes } from "../const/size";
import { GENDER_OPTIONS } from "../const/gender";

const fileOrStringUrl = z.union([
  z
    .instanceof(File, { message: "Must be a file" })
    .refine(
      (file) => file.size > 0 && file.size <= profilePictureMaxSizeBytes,
      "File cannot be empty",
    ),
  z.string().url("Must be a valid URL string"),
]);

const emptyStringToUndefined = z.literal("").transform(() => undefined);

export const doctorSchema = z.object({
  first_name: z.string().max(100).min(1, "First name is required"),
  second_name: z.string().max(100).min(1, "Second name is required"),
  middle_name: z.string().max(100).or(emptyStringToUndefined).optional(),

  // dateOfBirth: z.coerce.number().int().positive("Invalid date of birth"),
  dateOfBirth: z.coerce
    .date({
      error: () => ({ message: "Invalid date of birth" }),
    })
    .max(new Date(), "Date of birth cannot be in the future"),

  city: z.string().max(100).min(1, "City is required"),
  state: z.string().max(100).min(1, "State is required"),
  country: z.string().max(100).min(1, "Country is required"),
  address: z.string().max(200).min(5, "Address must be at least 5 characters"),

  email: z.email("Invalid email address"),
  phone_number: z.string().max(20).min(10, "Phone number must be at least 10 characters"),
  alternativePhoneNumber: z.string().max(20).or(emptyStringToUndefined).optional(),

  blood_group: z.string().max(10).or(emptyStringToUndefined).optional(),
  gender: z.enum(GENDER_OPTIONS, {
    message: "Gender must be MALE, FEMALE, or OTHER",
  }),

  registrationNumber: z.string().max(100).min(1, "Registration number is required"),
  primaryDegree: z.string().max(100).min(1, "Primary degree is required"),
  specialization: z.string().max(100).min(1, "Specialization is required"),
  subSpecialization: z.string().max(100).or(emptyStringToUndefined).optional(),
  yearsOfExperience: z.coerce.number().min(0, "Experience cannot be negative"),

  clinicName: z.string().max(100).or(emptyStringToUndefined).optional(),
  clinicAddress: z.string().max(200).or(emptyStringToUndefined).optional(),
  consultationFees: z.coerce.number().min(0, "Fees cannot be negative").optional(),

  languagesSpoken: z.array(z.string().max(100)).optional(),
  areaOfExpertise: z.array(z.string().max(100)).optional(),
  awards: z.array(z.string().max(100)).default([]),

  aboutDoctor: z.string().max(2000).or(emptyStringToUndefined).optional(),

  acceptedTerms: z.boolean({ error: "You must accept the terms" }),
  emailVerified: z.boolean().optional(),
  phoneVerified: z.boolean().optional(),
  availableForChat: z.boolean().optional(),

  profilePicture: z
    .instanceof(File, { message: "Profile picture is required" })
    .refine(
      (file) => file.size > 0 && file.size <= profilePictureMaxSizeBytes,
      "File cannot be empty",
    )
    .refine((file) => file.type.startsWith("image/"), "Must be an image"),

  registrationCertificate: fileOrStringUrl,
  degreeCertificate: fileOrStringUrl,
  governmentId: fileOrStringUrl,
});

export type DoctorFormData = z.infer<typeof doctorSchema>;
