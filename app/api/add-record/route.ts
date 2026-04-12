import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SB_TABLES } from "@/lib/supabase/tables";

export async function GET() {
  return NextResponse.json({ message: "Hello from the REST API" });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse the incoming JSON payload from the client
    const body = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Missing title or content" }, { status: 400 });
    }

    // 2. Write to the DB
    const { data, error } = await supabase
      .from(SB_TABLES.patient_records)
      .insert([{ title, content, user_id: user.id }])
      .select() // Returns the newly created document
      .single();

    if (error) throw error;

    return NextResponse.json({ document: data }, { status: 201 });
  } catch (error) {
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
  // const authHeader = request.headers.get("Authorization");
  // if (!authHeader?.startsWith("Bearer ")) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  // const idToken = authHeader.split("Bearer ")[1];

  // let uid: string;

  // try {
  //   if (!idToken) throw new Error("No id token or incorrect id token in the header");
  //   const decodedToken = await admin.auth().verifyIdToken(idToken);
  //   uid = decodedToken.uid;
  //   if (!uid) throw new Error("No user id found");
  // } catch {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  // const body = await request.json();
  // const doc: Collections["PATIENT_RECORDS"] = {
  //   userId: uid,
  //   content: body.content,
  //   createdAt: admin.firestore.FieldValue.serverTimestamp(),
  // };
  // const docRef = await adminDb.collection(FIREBASE.COLLECTION.PATIENT_RECORDS).add(doc);

  // algoliaClient.saveObject({
  //   indexName: FIREBASE.COLLECTION.PATIENT_RECORDS,
  //   body: {
  //     objectID: docRef.id,
  //     ...doc,
  //   },
  // });

  // return NextResponse.json({ id: docRef.id }, { status: 201 });
}
