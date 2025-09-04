
import { NextRequest, NextResponse } from 'next/server';

// This is the new backend API route to handle calls to the Gemini API.
// It securely uses the API key from environment variables on the server-side.

// Helper function to prepare the payload for the Gemini API
const prepareGeminiPayload = (messages: { role: string; parts: { text: string }[] }[]) => {
  // Ensure we don't send an empty contents array
  if (messages.length === 0) {
    return { contents: [{ role: 'user', parts: [{ text: 'Hello' }] }] };
  }
  return { contents: messages };
};

// Helper function to prepare the payload for suggested replies
const prepareSuggestionsPayload = (aiMessageText: string) => {
  const prompt = `Based on this AI response: "${aiMessageText}", suggest three distinct and concise follow-up questions or replies for the user. Keep them very short, like tweet-length.`;
  return {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          replies: {
            type: "ARRAY",
            items: { type: "STRING" }
          }
        },
      }
    }
  };
};


export async function POST(req: NextRequest) {
  const { messages, apiKey: userApiKey, action } = await req.json();

  // Use the user-provided key or fall back to the environment variable
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key is not configured. Please set it in your environment or provide one.' },
      { status: 400 }
    );
  }

  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  try {
    let payload;
    if (action === 'get_suggestions' && messages.length > 0) {
      const lastMessage = messages[messages.length - 1].parts[0].text;
      payload = prepareSuggestionsPayload(lastMessage);
    } else {
      payload = prepareGeminiPayload(messages);
    }

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Gemini API Error:", errorBody);
      return NextResponse.json(
        { error: `Gemini API request failed with status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Internal Server Error:", error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.', details: error.message },
      { status: 500 }
    );
  }
}
