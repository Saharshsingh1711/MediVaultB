import { NextResponse } from "next/server";
import { SB_TABLES } from "@/lib/supabase/tables";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { doctorSchema } from "@/lib/zod/userDoc";
import { algolia } from "@/lib/algolia";

/*
req body as a multipart/form-data
{
  first_name: string; // min: 1, max: 100 chars
  second_name: string; // min: 1, max: 100 chars
  middle_name?: string; // max: 100 chars
  dateOfBirth: string; // new Date(xyz) should be valid and <= current date
  city: string; // min: 1, max: 100 chars
  state: string; // min: 1, max: 100 chars
  country: string; // min: 1, max: 100 chars
  email: string; // valid email format
  password: string; // min: 6 chars
  blood_group?: string; // max: 10 chars
  phone_number: string; // min: 10, max: 20 chars
  address: string; // min: 5, max: 200 chars
  gender: "MALE" | "FEMALE" | "OTHER"; // strictly from GENDER_OPTIONS
  profilePicture: File; // must be image/*, size > 0 and <= profilePictureMaxSizeBytes
  registrationNumber: string; // min: 1, max: 100 chars
  primaryDegree: string; // min: 1, max: 100 chars
  specialization: string; // min: 1, max: 100 chars
  yearsOfExperience: number; // min: 0 (cannot be negative)
  subSpecialization?: string; // max: 100 chars
  acceptedTerms: boolean; // must be explicitly true
  clinicName?: string; // max: 100 chars
  clinicAddress?: string; // max: 200 chars
  consultationFees?: number; // min: 0 (cannot be negative)
  availableForChat?: boolean;
  languagesSpoken?: string[]; // strings max: 100 chars each
  alternativePhoneNumber?: string; // max: 20 chars
  areaOfExpertise?: string[]; // strings max: 100 chars each
  aboutDoctor?: string; // max: 2000 chars
  awards: string[]; // strings max: 100 chars each, defaults to []
  registrationCertificate: File | string; // File (<= profilePictureMaxSizeBytes) OR valid URL string
  degreeCertificate: File | string; // File (<= profilePictureMaxSizeBytes) OR valid URL string
  governmentId: File | string; // File (<= profilePictureMaxSizeBytes) OR valid URL string
}

response:
{
  document: {
    user_id: string
    first_name: string
    second_name: string
    middle_name: string
    dateOfBirth: string
    city: string
    state: string
    country: string
    email: string
    blood_group: string
    phone_number: string
    address: string
    gender: string
    profilePicture: string
    registrationNumber: string
    primaryDegree: string
    specialization: string
    yearsOfExperience: number
    subSpecialization: string
    // not included now, will be implemented later:emailVerified: boolean
    // not included now, will be implemented later:phoneVerified: boolean
    acceptedTerms: boolean
    clinicName: string
    clinicAddress: string
    consultationFees: number
    availableForChat: boolean
    languagesSpoken: Array<string>
    alternativePhoneNumber: string
    areaOfExpertise: Array<string>
    aboutDoctor: string
    awards: Array<string>
    registrationCertificate: string
    degreeCertificate: string
    governmentId: string
  }
}
*/

const strToNumAndSetObj = async (
  formData: FormData,
  key: string,
  obj: Record<string, unknown>,
  errStatus: number = 400,
  errStr?: string,
  cb?: (val: number) => Promise<void>,
) => {
  const num = formData.get(key);
  const numValue = typeof num === "string" ? parseInt(num, 10) : null;

  if (numValue === null || isNaN(numValue)) {
    return NextResponse.json({ error: errStr || `Invalid ${key} value` }, { status: errStatus });
  }

  obj[key] = numValue;

  await cb?.(numValue);
  return null;
};

const strToBoolAndSetObj = async (
  formData: FormData,
  key: string,
  obj: Record<string, unknown>,
  errStatus: number = 400,
  errStr?: string,
  cb?: (val: boolean) => Promise<void>,
) => {
  const bool = formData.get(key);

  let boolValue: boolean | null = null;
  if (typeof bool === "string") {
    if (bool.toLowerCase() === "true") {
      boolValue = true;
    } else if (bool.toLowerCase() === "false") {
      boolValue = false;
    }
  }

  if (boolValue === null) {
    return NextResponse.json({ error: errStr || `Invalid ${key} value` }, { status: errStatus });
  }

  obj[key] = boolValue;

  await cb?.(boolValue);
  return null;
};

const strToArrAndSetObj = async (
  formData: FormData,
  key: string,
  obj: Record<string, unknown>,
  errStatus: number = 400,
  errStr?: string,
  cb?: (val: Array<string>) => Promise<void>,
) => {
  const arr = formData.get(key);

  console.log({ arr });

  const arrValue = typeof arr === "string" ? JSON.parse(arr) : null;
  console.log({ arrValue });
  if (arrValue === null || !Array.isArray(arrValue)) {
    return NextResponse.json({ error: errStr || `Invalid ${key} value` }, { status: errStatus });
  }

  obj[key] = arrValue;

  await cb?.(arrValue);
  return null;
};

const uploadFileAndGetUrl = async (
  file: File,
  userId: string,
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  bucketName: string,
): Promise<[string | null, NextResponse | null]> => {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const fileExtension = file.name.split(".").pop();
  const filePath = `${userId}/${Date.now()}-avatar.${fileExtension}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Error uploading profile picture:", uploadError);
    return [
      null,
      NextResponse.json(
        { error: "Failed to upload profile picture: " + uploadError.message },
        { status: 500 },
      ),
    ];
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(filePath);

  const publicUrl = publicUrlData.publicUrl;
  return [publicUrl, null];
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const supabaseAdmin = await createAdminClient();

  try {
    const formData = await request.formData();

    const password = formData.get("password") as string;

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password is required and should be at least 6 characters long" },
        { status: 400 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formDataObj: any = {};

    formData.keys().forEach((key) => {
      formDataObj[key] = formData.get(key);
    });

    if (formDataObj.password) delete formDataObj.password;
    formDataObj.emailVerified = false;
    formDataObj.phoneVerified = false;

    let r: NextResponse | null;
    // if ((r = await strToNumAndSetObj(formData, "dateOfBirth", formDataObj))) return r;
    if ((r = await strToNumAndSetObj(formData, "yearsOfExperience", formDataObj))) return r;
    if ((r = await strToNumAndSetObj(formData, "consultationFees", formDataObj))) return r;
    // if ((r = await strToBoolAndSetObj(formData, "emailVerified", formDataObj))) return r;
    // if ((r = await strToBoolAndSetObj(formData, "phoneVerified", formDataObj))) return r;
    if ((r = await strToBoolAndSetObj(formData, "acceptedTerms", formDataObj))) return r;
    if ((r = await strToBoolAndSetObj(formData, "availableForChat", formDataObj))) return r;
    if ((r = await strToArrAndSetObj(formData, "languagesSpoken", formDataObj))) return r;
    if ((r = await strToArrAndSetObj(formData, "areaOfExpertise", formDataObj))) return r;
    if ((r = await strToArrAndSetObj(formData, "awards", formDataObj))) return r;

    const validatedData = doctorSchema.safeParse(formDataObj);

    if (validatedData.error) {
      console.log(validatedData.error.issues);
      return NextResponse.json(
        { error: "Invalid data in " + validatedData.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    } else if (!validatedData.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const {
      data: { user },
      error: signUpError,
    } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.data.email,
      password: password,
      email_confirm: true,
    });

    if (signUpError) {
      console.log(signUpError);
      return NextResponse.json(
        { error: "Failed to create user (Auth): " + signUpError.message },
        { status: 500 },
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "User creation failed for unknown reasons" },
        { status: 500 },
      );
    }

    const [profilePickPubUrl, fileUploadErr] = await uploadFileAndGetUrl(
      validatedData.data.profilePicture,
      user.id,
      supabaseAdmin,
      "profile-pic",
    );
    if (fileUploadErr) return fileUploadErr;

    let registrationCertificateUrl: string | null = null;
    let governmentIdUrl: string | null = null;
    let degreeCertificateUrl: string | null = null;

    const bucketName = "doc-data";

    if (validatedData.data.registrationCertificate instanceof File) {
      const [url, fileUploadErr] = await uploadFileAndGetUrl(
        validatedData.data.registrationCertificate,
        user.id,
        supabaseAdmin,
        bucketName,
      );
      if (fileUploadErr) return fileUploadErr;
      registrationCertificateUrl = url as string;
    }
    if (validatedData.data.governmentId instanceof File) {
      const [url, fileUploadErr] = await uploadFileAndGetUrl(
        validatedData.data.governmentId,
        user.id,
        supabaseAdmin,
        bucketName,
      );
      if (fileUploadErr) return fileUploadErr;
      governmentIdUrl = url as string;
    }
    if (validatedData.data.degreeCertificate instanceof File) {
      const [url, fileUploadErr] = await uploadFileAndGetUrl(
        validatedData.data.degreeCertificate,
        user.id,
        supabaseAdmin,
        bucketName,
      );
      if (fileUploadErr) return fileUploadErr;
      degreeCertificateUrl = url as string;
    }

    const tableData = {
      user_id: user.id,
      ...validatedData.data,
      profilePicture: profilePickPubUrl,
      registrationCertificate: registrationCertificateUrl,
      governmentId: governmentIdUrl,
      degreeCertificate: degreeCertificateUrl,
    };

    const { data, error } = await supabaseAdmin
      .from(SB_TABLES.user_doctor)
      .insert([tableData])
      .select()
      .single();

    if (error) throw error;

    const algoliaRecord = {
      objectID: data.user_id,
      first_name: data.first_name,
      second_name: data.second_name,
      city: data.city,
      state: data.state,
      country: data.country,
      address: data.address,
      languagesSpoken: data.languagesSpoken,
      consultationFees: data.consultationFees,
      profilePicture: data.profilePicture,
      specialization: data.specialization,
    };

    await algolia.algoliaClient.saveObject({
      indexName: algolia.indexes.DOC_INDEX_NAME,
      body: algoliaRecord,
    });

    //TODO: send email verification and phone verification (if phone number provided) here
    delete data.emailVerified;
    delete data.phoneVerified;

    return NextResponse.json({ document: data }, { status: 201 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        error:
          error && typeof error === "object" && "message" in error
            ? `${error?.message}`
            : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
