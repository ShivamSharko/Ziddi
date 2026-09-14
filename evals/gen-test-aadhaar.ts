import { aadhaarCheckDigit } from "../packages/domain/src/aadhaar";

const prefix = "23456789012";
const check = aadhaarCheckDigit(prefix);
console.log(`Test Aadhaar (Verhoeff-valid): ${prefix}${check}`);

