/**
 * Knuth-Morris-Pratt (KMP) Algorithm for efficient substring searching.
 * Optimized for clinical data analysis where scanning large medical texts 
 * for emergency keywords must be sub-millisecond.
 */

/**
 * Precomputes the Longest Prefix Suffix (LPS) array for the pattern.
 */
function computeLPSArray(pattern: string): number[] {
  const lps = new Array(pattern.length).fill(0);
  let length = 0;
  let i = 1;

  while (i < pattern.length) {
    if (pattern[i].toLowerCase() === pattern[length].toLowerCase()) {
      length++;
      lps[i] = length;
      i++;
    } else {
      if (length !== 0) {
        length = lps[length - 1];
      } else {
        lps[i] = 0;
        i++;
      }
    }
  }
  return lps;
}

/**
 * Searches for all occurrences of pattern in text using KMP.
 * Returns true if the pattern is found at least once.
 */
export function kmpSearch(text: string, pattern: string): boolean {
  if (pattern.length === 0) return true;
  if (text.length === 0) return false;

  const n = text.length;
  const m = pattern.length;
  const lps = computeLPSArray(pattern);

  let i = 0; // index for text
  let j = 0; // index for pattern

  while (i < n) {
    if (pattern[j].toLowerCase() === text[i].toLowerCase()) {
      i++;
      j++;
    }

    if (j === m) {
      return true; // Match found
    } else if (i < n && pattern[j].toLowerCase() !== text[i].toLowerCase()) {
      if (j !== 0) {
        j = lps[j - 1];
      } else {
        i++;
      }
    }
  }

  return false;
}

/**
 * Scans a medical text for a list of clinical emergency keywords.
 * Returns the list of matched keywords.
 */
export function scanCriticalInsights(text: string, keywords: string[]): string[] {
  const matches: string[] = [];
  
  for (const keyword of keywords) {
    if (kmpSearch(text, keyword)) {
      matches.push(keyword);
    }
  }

  return matches;
}

export const EMERGENCY_KEYWORDS = [
  "Penicillin Allergy",
  "Diabetes",
  "Cardiac Arrest",
  "Hemophilia",
  "Asthma",
  "Hypertension",
  "Epilepsy",
  "Anaphylaxis",
  "Kidney Failure",
  "Blood Thinner",
  "Anemia",
  "Thyroid Disorder",
  "Migraine",
  "Allergic Rhinitis",
  "Viral Fever",
  "High Temperature"
];
