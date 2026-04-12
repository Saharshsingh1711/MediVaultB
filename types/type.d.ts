type MedicalRecord = {
    id: string;
    patient_id: string;
    title: string;
    record_type: string;
    raw_text_content: string | null;
    ai_summary: string | null;
    file_url: string;
    is_emergency_flag: boolean;
    created_at: string;
    // Joined patient info (for doctors)
    patient_name?: string;
    patient_email?: string;
};