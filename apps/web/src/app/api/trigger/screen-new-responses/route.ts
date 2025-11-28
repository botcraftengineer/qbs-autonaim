import { NextResponse } from "next/server";
import { triggerScreenNewResponses } from "~/actions/trigger";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { vacancyId } = body;

    if (!vacancyId || typeof vacancyId !== "string") {
      return NextResponse.json(
        { error: "vacancyId is required" },
        { status: 400 },
      );
    }

    const result = await triggerScreenNewResponses(vacancyId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error in screen-new-responses API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
