import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page") || "1";
    const pageSize = searchParams.get("pageSize") || "10";
    const q = searchParams.get("q") || "";

    // เรียก backend API 
    const backendUrl = new URL(
      `${process.env.NEXT_PUBLIC_API_URL}/reports`
    );
    backendUrl.searchParams.append("page", page);
    backendUrl.searchParams.append("pageSize", pageSize);
    if (q) backendUrl.searchParams.append("q", q);

    const response = await fetch(backendUrl.toString(), {
      headers: {
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
