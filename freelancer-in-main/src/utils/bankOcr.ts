import Tesseract from "tesseract.js";
import { toast } from "sonner";

interface BankDetails {
  bank_holder_name: string;
  bank_account_number: string;
  bank_ifsc_code: string;
}

/**
 * ഫോട്ടോയിൽ നിന്ന് ബാങ്ക് വിവരങ്ങൾ ഓട്ടോമാറ്റിക് ആയി സ്കാൻ ചെയ്ത് ഉറപ്പുവരുത്തുന്നു
 */
export const verifyBankDetailsWithOCR = async (
  file: File,
  expectedDetails: BankDetails
): Promise<boolean> => {
  const toastId = toast.loading("Scanning photo for bank details...");

  try {
    // Tesseract ഉപയോഗിച്ച് ഫോട്ടോയിലെ ടെക്സ്റ്റ് റീഡ് ചെയ്യുന്നു
    const result = await Tesseract.recognize(file, "eng");
    const detectedText = result.data.text.toLowerCase();

    const requiredName = expectedDetails.bank_holder_name.toLowerCase();
    const requiredNumber = expectedDetails.bank_account_number.toLowerCase();
    const requiredIfsc = expectedDetails.bank_ifsc_code.toLowerCase();

    // സ്പെഷ്യൽ ക്യാരക്ടറുകൾ ഒഴിവാക്കി ചെക്ക് ചെയ്യാൻ (കൂടുതൽ കൃത്യതയ്ക്ക്)
    const cleanString = (str: string) => str.replace(/[^a-z0-9]/g, "");
    const cleanedText = cleanString(detectedText);

    const matchName = detectedText.includes(requiredName) || cleanedText.includes(cleanString(requiredName));
    const matchNumber = detectedText.includes(requiredNumber) || cleanedText.includes(cleanString(requiredNumber));
    const matchIfsc = detectedText.includes(requiredIfsc) || cleanedText.includes(cleanString(requiredIfsc));

    if (!matchName || !matchNumber || !matchIfsc) {
      const missingFields = [];
      if (!matchName) missingFields.push("Account Holder Name");
      if (!matchNumber) missingFields.push("Account Number");
      if (!matchIfsc) missingFields.push("IFSC Code");

      toast.error(
        `Verification Failed! Cannot detect: ${missingFields.join(", ")}. Please ensure the photo is clear.`,
        { id: toastId, duration: 5000 }
      );
      return false;
    }

    toast.success("Bank details detected successfully!", { id: toastId });
    return true;
  } catch (err) {
    console.error("OCR Error:", err);
    toast.error("Failed to read text from the image. Please try again with a clearer picture.", { id: toastId });
    return false;
  }
};
