import { NextResponse } from "next/server";
import { getHealthStatus } from "@/lib/health";

export async function GET() {
  const { body, httpStatus } = await getHealthStatus();
  return NextResponse.json(body, { status: httpStatus });
}
