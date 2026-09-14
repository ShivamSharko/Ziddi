import { NextResponse } from "next/server";
import { citizenToken } from "@/lib/aadhaar";
import { getOtpService } from "@/lib/otp";

export async function POST(request: Request) {
  const body = await request.json();
  const token = typeof body.aadhaar === "string" ? citizenToken(body.aadhaar) : null;
  if (token === null) {
    return NextResponse.json({ error: "Valid 12-digit Aadhaar required" }, { status: 400 });
  }
  const code = typeof body.code === "string" ? body.code : "";
  const verified = getOtpService().verify(token, code);
  if (!verified) {
    return NextResponse.json(
      { error: "Invalid or expired OTP (max 3 attempts, 5 minute validity)" },
      { status: 401 },
    );
  }
  return NextResponse.json({ verified: true });
}
