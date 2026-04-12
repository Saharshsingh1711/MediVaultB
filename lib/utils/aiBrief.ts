export interface AIBriefData {
  confidenceScore: number;
  shortBrief: string;
  keyFindings: string[];
}

export function generateAIBrief(title: string, rawText: string | null | undefined): AIBriefData {
  // Mock generation logic based on length or keywords
  const score = rawText ? Math.floor(Math.random() * 10) + 85 : 0; // 85-94 score if text exists
  
  if (!rawText) {
    return {
      confidenceScore: 0,
      shortBrief: `The document "${title}" has not been fully deciphered or lacks extractable clinical text.`,
      keyFindings: [
        "Awaiting OCR completion or manual review.",
        "Clinical markers could not be automatically indexed.",
        "Please review the original document."
      ]
    };
  }

  // Very rudimentary keyword spotting for the mock
  const lowerText = rawText.toLowerCase();
  const findings: string[] = [];
  
  if (lowerText.includes("blood") || lowerText.includes("cbc")) {
    findings.push("Complete Blood Count (CBC) parameters detected.");
    if (lowerText.includes("normal")) findings.push("Blood markers appear to be within normal limits.");
  }
  
  if (lowerText.includes("scan") || lowerText.includes("x-ray") || lowerText.includes("mri")) {
    findings.push("Imaging markers identified in the extracted text.");
    findings.push("No acute abnormalities detected based on standard imaging keywords.");
  }

  if (findings.length === 0) {
    findings.push("Routine clinical evaluation markers identified.");
    findings.push("Vitals and primary parameters are stable.");
    findings.push("Follow-up suggested in 3-6 months if symptoms persist.");
  }

  return {
    confidenceScore: score,
    shortBrief: `This report "${title}" appears to be a standard clinical evaluation. Overall extractable indicators are mostly within expected limits, though continued monitoring is recommended by clinical guidelines.`,
    keyFindings: findings.slice(0, 3) 
  };
}
