import { z } from "zod";
import { profilePictureMaxSizeBytes } from "../const/size";
import { GENDER_OPTIONS } from "../const/gender";

export const userSchema = z.object({
  first_name: z.string().max(50).min(1, "First name is required"),
  second_name: z.string().max(50).min(1, "Second name is required"),
  middle_name: z.string().max(50).optional(),

  email: z.email("Invalid email address").max(100).min(1, "Email is required"),

  age: z.coerce
    .number()
    .int()
    .positive("Age must be a positive number")
    .max(120, "Age must be less than or equal to 120"),

  // age: z
  //   .string()
  //   .max(3)
  //   .min(1)
  //   .refine((e) => {
  //     const v = parseInt(e);
  //     if (isNaN(v) || v < 0 || v > 120) {
  //       return false;
  //     } else {
  //       return true;
  //     }
  //   }, "Age must be string, and should be [0,120]").transform(e => parseInt(e)),

  blood_group: z.string().max(10).optional(),
  phone_number: z.string().max(20).min(10, "Phone number must be at least 10 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  gender: z.enum(GENDER_OPTIONS, {
    error: () => ({ message: "Gender must be MALE, FEMALE, or OTHER" }),
  }),
  profilePicture: z
    .instanceof(File, { message: "Profile picture is required" })
    .refine(
      (file) => file.size > 0 && file.size <= profilePictureMaxSizeBytes,
      "File cannot be empty",
    )
    .refine((file) => file.type.startsWith("image/"), "File must be an image"),

  emergency_contact_name: z.string().max(150).min(1, "Emergency contact name is required"),
  emergency_contact_phone: z.string().max(20).min(10, "Emergency contact phone is required"),
});

export type UserFormData = z.infer<typeof userSchema>;
