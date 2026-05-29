import { NextResponse } from "next/server";
import { getFoodData } from "@/lib/foodData";

export async function GET() {
  return NextResponse.json({ success: true, data: getFoodData() });
}
