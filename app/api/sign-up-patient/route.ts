import { NextResponse } from "next/server";
import { SB_TABLES } from "@/lib/supabase/tables";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { userSchema } from "@/lib/zod/userPatient";
import { algolia } from "@/lib/algolia";

/*
req body as a multipart/form-data
{
  first_name: string; // min: 1, max: 50 chars
  second_name: string; // min: 1, max: 50 chars
  middle_name?: string; // max: 50 chars
  email: string; // valid email format, min: 1, max: 100 chars
  password: string; // handled separately for auth
  age: number; // positive integer, max: 120
  blood_group?: string; // max: 10 chars
  phone_number: string; // min: 10, max: 20 chars
  address: string; // min: 5 chars
  gender: "MALE" | "FEMALE" | "OTHER"; // strictly from GENDER_OPTIONS
  profilePicture: File; // must be image/*, size > 0 and <= profilePictureMaxSizeBytes
  emergency_contact_name: string; // min: 1, max: 150 chars
  emergency_contact_phone: string; // min: 10, max: 20 chars
}

response:
{
  document: {
    user_id: string
    first_name: string
    second_name: string
    middle_name: string
    email: string
    age: number
    phone_number: string
    address: string
    gender: string
    profilePicture: string
    emergency_contact_name: string
    emergency_contact_phone: string
    blood_group: string
  }
}

*/

export async function POST(request: Request) {
  const supabase = await createClient();
  const supabaseAdmin = await createAdminClient();

  // const {
  //   data: { user },
  //   error: authError,
  // } = await supabase.auth.getUser();

  // if (authError || !user) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  try {
    // Parse the incoming JSON payload from the client
    const formData = await request.formData();

    const password = formData.get("password") as string;

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password is required and should be at least 6 characters long" },
        { status: 400 },
      );
    }

    const age = formData.get("age");
    const ageNumber = typeof age === "string" ? parseInt(age, 10) : null;

    if (ageNumber === null || isNaN(ageNumber)) {
      return NextResponse.json({ error: "Invalid age value" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formDataObj: any = {};

    formData.keys().forEach((key) => {
      formDataObj[key] = formData.get(key);
    });

    if (formDataObj.password) delete formDataObj.password;

    // const formObject = Object.fromEntries(formData.entries())

    if (formDataObj?.age && typeof formDataObj.age === "string") {
      formDataObj.age = ageNumber;
    }

    const validatedData = userSchema.safeParse(formDataObj);

    if (validatedData.error) {
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

    const file = validatedData.data.profilePicture;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const fileExtension = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}-avatar.${fileExtension}`;
    const bucketName = "profile-pic"; // Replace with your actual public bucket name

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading profile picture:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload profile picture: " + uploadError.message },
        { status: 500 },
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    const tableData = { user_id: user.id, ...validatedData.data, profilePicture: publicUrl };

    const { data, error } = await supabaseAdmin
      .from(SB_TABLES.user_patient)
      .insert([tableData])
      .select()
      .single();

    if (error) throw error;

    const algoliaRecord = {
      objectID: data.user_id,
      first_name: data.first_name,
      second_name: data.second_name,
      email: data.email,
      age: data.age,
      phone_number: data.phone_number,
      address: data.address,
      profilePicture: data.profilePicture,
    };

    await algolia.algoliaClient.saveObject({
      indexName: algolia.indexes.PATIENT_INDEX_NAME,
      body: algoliaRecord,
    });

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
