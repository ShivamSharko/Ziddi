import { ConsoleOtpAdapter, OtpService } from "@ziddi/agent";

declare global {
  var __ziddiOtp: OtpService | undefined;
}

export const getOtpService = (): OtpService => {
  if (globalThis.__ziddiOtp === undefined) {
    globalThis.__ziddiOtp = new OtpService(new ConsoleOtpAdapter());
  }
  return globalThis.__ziddiOtp;
};
