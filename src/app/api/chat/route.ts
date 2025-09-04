import { NextRequest, NextResponse } from 'next/server';
import { Letta } from '@letta-ai/letta-client';
import { ChatCompletionMessageParam } from '@letta-ai/letta-client/resources/chat/completions';

const LETTA_AGENT_ID = 'agent-a1ebfeef-cf03-4b22-be73-d83e24306f77';

// Helper to map incoming message format to what the Letta client expects.
const mapMessagesForLetta = (messages: { role: string; parts: { text: string }[] }[]): ChatCompletionMessageParam[] => {
  return messages.map(msg => ({
    role: msg.role === 'model' ? 'assistant' : 'user',
    content: msg.parts[0].text,
  }));
};

export async function POST(req: NextRequest) {
  const { messages, apiKey: userApiKey, action } = await req.json();

  const apiKey = userApiKey || process.env.API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key is not configured. Please set it in your environment or provide one.' },
      { status: 400 }
    );
  }

  const letta = new Letta({ apiKey });

  try {
    if (action === 'get_suggestions' && messages.length > 0) {
      const lastMessageText = messages[messages.length - 1].parts[0].text;
      const prompt = `Based on this AI response: "${lastMessageText}", suggest three distinct and concise follow-up questions or replies for the user. Keep them very short, like tweet-length.`;

      const response = await letta.chat.completion.create({
        agent_id: LETTA_AGENT_ID,
        messages: [{ role: 'user', content: prompt }],
        response_format: {
          type: 'json_object',
          schema: {
            type: "object",
            properties: {
              replies: {
                type: "array",
                items: { type: "string" }
              }
            },
          }
        }
      });

      const suggestionsJson = response.choices[0]?.message?.content;
      if (!suggestionsJson) {
        throw new Error("Failed to get suggestions from the agent.");
      }

      // Reformat the response to match what the frontend expects
      return NextResponse.json({
        candidates: [{
          content: {
            parts: [{ text: suggestionsJson }]
          }
        }]
      });

    } else {
      const lettaMessages = mapMessagesForLetta(messages);

      const response = await letta.chat.completion.create({
        agent_id: LETTA_AGENT_ID,
        messages: lettaMessages.length > 0 ? lettaMessages : [{ role: 'user', content: 'Hello' }],
      });

      const aiText = response.choices[0]?.message?.content;
      if (!aiText) {
        throw new Error("Failed to get a response from the agent.");
      }

      // Reformat the agent's response to match the original Gemini structure
      // This minimizes changes needed on the frontend.
      return NextResponse.json({
        candidates: [{
          content: {
            parts: [{ text: aiText }]
          }
        }]
      });
    }

  } catch (error: any) {
    console.error("Letta API Error:", error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.', details: error.message },
      { status: 500 }
    );
  }
}


