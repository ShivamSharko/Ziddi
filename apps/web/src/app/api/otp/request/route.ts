import { NextResponse } from "next/server";
import { citizenToken } from "@/lib/aadhaar";
import { getOtpService } from "@/lib/otp";

export async function POST(request: Request) {
  const body = await request.json();
  const token = typeof body.aadhaar === "string" ? citizenToken(body.aadhaar) : null;
  if (token === null) {
    return NextResponse.json({ error: "Valid 12-digit Aadhaar required first" }, { status: 400 });
  }
  const code = await getOtpService().issue(token);
  return NextResponse.json({
    ok: true,
    devCode: code,
    devNote: "Demo mode: OTP shown here. Production: SMS to Aadhaar-linked mobile via licensed gateway.",
  });
}
