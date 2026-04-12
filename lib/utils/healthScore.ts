export interface HealthScoreInput {
  profile: {
    blood_group?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    address?: string;
    gender?: string;
    profile_picture_url?: string;
    allergies?: string; // Future-proofing
    chronic_conditions?: string; // Future-proofing
  };
  recordsCount: number;
  lastUploadDate?: string;
}

export function calculateHealthSyncScore(input: HealthScoreInput): number {
  let score = 0;

  // 1. Profile Completion (Max 50%)
  const profileFields = [
    input.profile.blood_group,
    input.profile.emergency_contact_name,
    input.profile.emergency_contact_phone,
    input.profile.address,
    input.profile.gender,
    input.profile.profile_picture_url,
  ];

  const completedFields = profileFields.filter(field => !!field && field !== "").length;
  // Weight each field as ~8.33% (50 / 6)
  score += (completedFields / profileFields.length) * 50;

  // 2. Activity / Record Frequency (Max 50%)
  // If they have at least 1 record, they get base activity points
  if (input.recordsCount > 0) {
    score += 20;
  }

  // If they've uploaded in the last 6 months
  if (input.lastUploadDate) {
    const lastUpload = new Date(input.lastUploadDate);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    if (lastUpload >= sixMonthsAgo) {
      score += 20;
    }
  }

  // Multi-upload bonus
  if (input.recordsCount >= 3) {
    score += 10;
  }

  return Math.round(Math.min(score, 100));
}
