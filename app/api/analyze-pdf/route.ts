import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Groq API key not configured" },
        { status: 500 }
      );
    }

    const { text, title } = await req.json();

    if (!text || text.trim().length < 10) {
      return NextResponse.json({
        summary: {
          shortBrief: `The document "${title || "Untitled"}" could not be analyzed — insufficient text was extracted.`,
          keyFindings: [
            "The uploaded document may be a scanned image without selectable text.",
            "Try uploading a text-based PDF for better results.",
            "Manual review of the original document is recommended.",
          ],
          recommendations: ["Upload a text-based PDF or consult your physician for interpretation."],
          confidenceScore: 0,
          documentType: "Unknown",
        },
      });
    }

    // Truncate very large documents to stay within token limits
    const truncatedText = text.length > 8000 ? text.substring(0, 8000) + "\n...[truncated]" : text;

    const groqResponse = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are a medical document analysis assistant. Analyze the provided medical document text and return a structured JSON response. Be thorough but concise. Focus on extractable clinical data.

IMPORTANT: Return ONLY valid JSON with this exact structure, no other text:
{
  "shortBrief": "A 2-3 sentence summary of the document's purpose and key clinical context",
  "keyFindings": ["finding 1", "finding 2", "finding 3", "finding 4"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "confidenceScore": 85,
  "documentType": "Lab Report | Prescription | Imaging Report | Discharge Summary | Clinical Notes | Other"
}

Guidelines:
- shortBrief: Summarize what the document is about and the patient's overall status
- keyFindings: Extract 3-5 specific clinical findings, values, or observations from the text
- recommendations: Suggest 1-3 follow-up actions based on findings
- confidenceScore: Rate 0-100 how confident you are in the analysis quality (higher if clear medical data is present)
- documentType: Classify the document type`,
          },
          {
            role: "user",
            content: `Analyze this medical document titled "${title || "Untitled"}":\n\n${truncatedText}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1024,
        response_format: { type: "json_object" },
      }),
    });

    if (!groqResponse.ok) {
      const errorBody = await groqResponse.text();
      console.error("Groq API Error:", groqResponse.status, errorBody);
      return NextResponse.json(
        { error: `Groq API returned ${groqResponse.status}` },
        { status: 502 }
      );
    }

    const groqData = await groqResponse.json();
    const content = groqData.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Empty response from Groq" },
        { status: 502 }
      );
    }

    let summary;
    try {
      summary = JSON.parse(content);
    } catch {
      console.error("Failed to parse Groq response:", content);
      summary = {
        shortBrief: content.substring(0, 300),
        keyFindings: ["AI analysis completed but structured parsing failed."],
        recommendations: ["Review the original document manually."],
        confidenceScore: 50,
        documentType: "Unknown",
      };
    }

    // Ensure all required fields exist
    summary = {
      shortBrief: summary.shortBrief || "Analysis completed.",
      keyFindings: Array.isArray(summary.keyFindings) ? summary.keyFindings : [],
      recommendations: Array.isArray(summary.recommendations) ? summary.recommendations : [],
      confidenceScore: typeof summary.confidenceScore === "number" ? summary.confidenceScore : 75,
      documentType: summary.documentType || "Unknown",
    };

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error("Analyze PDF Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
