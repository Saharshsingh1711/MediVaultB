"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import { getServerUserRole } from "@/lib/supabase/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export async function login(formData: FormData) {
  const supabase = await createClient();

  let email = formData.get("email") as string;
  let password = formData.get("password") as string;
  const intendedRole = formData.get("intendedRole") as string;

  // Support for Patient ID based login. For test scenarios, map ID to email if @ isn't included.
  if (intendedRole === 'patient' && email && !email.includes('@')) {
    email = `${email.toLowerCase()}@medivault.com`;
    // Automatically use the test password if they are using a Patient ID 
    // so they don't have to type it manually during testing.
    password = password || "123456";
  }


  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  const supabaseAdmin = createAdminClient();

  const actualRole = await getServerUserRole(supabaseAdmin, authData.user.id, authData.user);

  // Strict validation: Role must match the portal tab
  if (intendedRole && actualRole !== intendedRole) {
    // Sign out immediately if role mismatch
    await supabase.auth.signOut();
    return {
      error: `Access Denied: This account is registered as a ${actualRole}. Please use the ${actualRole === 'doctor' ? 'Doctor Portal' : 'Patient Portal'}.`
    };
  }

  return { success: true, role: actualRole };
}


