import { env } from "@selectio/config";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 },
    );
  }

  try {
    const formData = await request.formData();

    // Проксируем запрос к OpenAI
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: formData,
      },
    );

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error("OpenAI transcription error:", error);
      return NextResponse.json(
        { error: "OpenAI API error", details: error },
        { status: openaiResponse.status },
      );
    }

    const data = await openaiResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Transcription proxy error:", error);
    return NextResponse.json(
      { error: "Internal proxy error" },
      { status: 500 },
    );
  }
}
