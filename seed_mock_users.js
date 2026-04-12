const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = "https://vpdvygvsfzidioxituia.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_AMWdNcF-CvO-ut5AuVHQsw_FjoC0WDe";

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Loading mock data...");
  const rawData = fs.readFileSync('lib/mock_patient_data.json', 'utf-8');
  const patients = JSON.parse(rawData);

  console.log(`Found ${patients.length} patients to seed via Auth Client.`);

  for (const patient of patients) {
    console.log(`\nProcessing patient: ${patient.login_email_mapping} -> PATIENT-ID: ${patient.patient_id}`);
    
    // Attempt sign in first
    let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: patient.login_email_mapping,
      password: '123456'
    });

    if (authError && authError.message.includes('Invalid login credentials')) {
        // Create user if not exists
        console.log(`User doesn't exist. Creating...`);
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: patient.login_email_mapping,
          password: '123456',
        });
        
        if (signUpError) {
          console.error(`Sign up error:`, signUpError.message);
          // Small delay to mitigate rate limit
          await new Promise(res => setTimeout(res, 2000));
          continue;
        }
        
        authData = signUpData;
    }

    if (authData && authData.user) {
        console.log(`Authenticated as ${patient.login_email_mapping} (ID: ${authData.user.id}). Bypassing RLS by being logged in...`);
        let userId = authData.user.id;
        
        // Insert into user_patient table
        const { error: profileError } = await supabase
        .from('user_patient')
        .upsert({
            user_id: userId,
            email: patient.login_email_mapping,
            first_name: patient.first_name,
            second_name: patient.last_name,
            blood_group: patient.blood_group,
            gender: 'Not Specified',
            phone_number: '555-0000',
            address: 'Medivault Mock System',
            emergency_contact_phone: '911',
            emergency_contact_name: 'System Admin',
            age: 30
        }, { onConflict: 'user_id' });
            
        if (profileError) {
            console.error(`Profile insertion error:`, profileError.message);
        } else {
            console.log(`Profile inserted successfully.`);
            
            // Replicate medical records
            if (patient.medical_reports && patient.medical_reports.length > 0) {
                // Ignore delete errors (might hit RLS but insert works)
                await supabase.from('medical_records').delete().eq('patient_id', userId);
                
                for (const report of patient.medical_reports) {
                    const { error: reportError } = await supabase
                    .from('medical_records')
                    .insert({
                        patient_id: userId,
                        title: report.title,
                        record_type: report.record_type,
                        raw_text_content: report.raw_text_content,
                        is_emergency_flag: report.is_emergency_flag,
                        file_url: 'https://example.com/mock_report.pdf'
                    });
                    
                    if (reportError) {
                        console.error(` - Error inserting report '${report.title}':`, reportError.message);
                    } else {
                        console.log(` - Report '${report.title}' loaded.`);
                    }
                }
            }
        }
        // Sign out to prevent session contamination
        await supabase.auth.signOut();
    }
  }
  console.log("\nSeeding complete!");
}

seed();
