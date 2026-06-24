import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { fetchS3FileContent } from "@/api/ecgApi";

/**
 * Creates a reviewed PDF by loading the original from URL and adding
 * a new page with doctor comments, signature, and review information.
 * The original ECG report remains unchanged on Page 1.
 * The healthcare professional review appears on a new Page 2.
 *
 * All processing happens in the browser.
 */
export async function createReviewedPdf(
  originalPdfUrl: string,
  options: {
    comments: string;
    doctorId: string;
    doctorName: string;
    signatureFile?: File | null;
    signatureDataUrl?: string | null; // Canvas data URL from drawing
  }
): Promise<Blob> {
  const { comments, doctorId, doctorName, signatureFile, signatureDataUrl } = options;

  // Fetch original PDF
  // Try to use our proxy first to avoid CORS issues
  let originalArrayBuffer: ArrayBuffer;
  
  try {
    // Extract key from URL
    // Format: https://bucket.s3.../key
    const urlObj = new URL(originalPdfUrl);
    const key = decodeURIComponent(urlObj.pathname.substring(1)); // Remove leading /

    // Fetch via proxy (returns base64 for PDFs)
    const base64Data = await fetchS3FileContent<string>(key);
    
    // Convert base64 to ArrayBuffer
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    originalArrayBuffer = bytes.buffer;

  } catch (proxyError) {
    console.warn("Proxy fetch failed, falling back to direct fetch:", proxyError);
    // Fallback to direct fetch
    const res = await fetch(originalPdfUrl);
    if (!res.ok) {
      throw new Error("Failed to download original PDF");
    }
    originalArrayBuffer = await res.arrayBuffer();
  }

  const pdfDoc = await PDFDocument.load(originalArrayBuffer);
  
  // Get the first page to use as a reference for page size
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();

  // Embed fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Create a new page for the healthcare professional review
  let reviewPage = pdfDoc.addPage([width, height]);
  
  const fontSize = 11;
  const labelColor = rgb(0.25, 0.25, 0.25);
  const textColor = rgb(0.1, 0.1, 0.1);
  let cursorY = height - 60;

  // Page Title
  reviewPage.drawText("Healthcare Professional Review", {
    x: width / 2,
    y: cursorY,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  cursorY -= 40;

  // Doctor Information Section
  reviewPage.drawText(`Doctor Name: ${doctorName || "-"}`, {
    x: 50,
    y: cursorY,
    size: fontSize,
    font,
    color: textColor,
  });
  cursorY -= 20;

  reviewPage.drawText(`Doctor ID: ${doctorId || "-"}`, {
    x: 50,
    y: cursorY,
    size: fontSize,
    font,
    color: textColor,
  });
  cursorY -= 20;

  const reviewDate = new Date().toLocaleString();
  reviewPage.drawText(`Reviewed On: ${reviewDate}`, {
    x: 50,
    y: cursorY,
    size: fontSize,
    font,
    color: textColor,
  });
  cursorY -= 40;

  // Separator Line
  reviewPage.drawLine({
    start: { x: 50, y: cursorY },
    end: { x: width - 50, y: cursorY },
    color: rgb(0.5, 0.5, 0.5),
    thickness: 1,
  });
  cursorY -= 30;

  // Healthcare Professional Comments Section
  reviewPage.drawText("Healthcare Professional Comments", {
    x: 50,
    y: cursorY,
    size: fontSize + 2,
    font: boldFont,
    color: labelColor,
  });
  cursorY -= 25;

  // Separator Line
  reviewPage.drawLine({
    start: { x: 50, y: cursorY },
    end: { x: width - 50, y: cursorY },
    color: rgb(0.5, 0.5, 0.5),
    thickness: 0.5,
  });
  cursorY -= 20;

  // Comments text with wrapping
  const wrappedComments = wrapText(comments || "No comments provided.", 85);
  const commentLines = wrappedComments.split('\n');
  
  for (const line of commentLines) {
    if (cursorY < 100) {
      // If we're running out of space, add a new page
      const newPage = pdfDoc.addPage([width, height]);
      newPage.drawText(line, {
        x: 50,
        y: height - 60,
        size: fontSize,
        font,
        color: textColor,
      });
      cursorY = height - 80;
      reviewPage = newPage; // Update reference to current page
    } else {
      reviewPage.drawText(line, {
        x: 50,
        y: cursorY,
        size: fontSize,
        font,
        color: textColor,
        lineHeight: 14,
      });
      cursorY -= 14;
    }
  }
  
  cursorY -= 30;

  // Separator Line for Signature Section
  reviewPage.drawLine({
    start: { x: 50, y: cursorY },
    end: { x: width - 50, y: cursorY },
    color: rgb(0.5, 0.5, 0.5),
    thickness: 0.5,
  });
  cursorY -= 25;

  // Doctor Signature Section
  reviewPage.drawText("Doctor Signature", {
    x: 50,
    y: cursorY,
    size: fontSize + 2,
    font: boldFont,
    color: labelColor,
  });
  cursorY -= 25;

  // Separator Line
  reviewPage.drawLine({
    start: { x: 50, y: cursorY },
    end: { x: width - 50, y: cursorY },
    color: rgb(0.5, 0.5, 0.5),
    thickness: 0.5,
  });
  cursorY -= 20;

  // Optional signature image (from file or canvas)
  let signatureImage: any = null;
  
  if (signatureFile) {
    const sigArrayBuffer = await signatureFile.arrayBuffer();
    const mime = signatureFile.type;
    if (mime === "image/png") {
      signatureImage = await pdfDoc.embedPng(sigArrayBuffer);
    } else {
      // Assume JPEG for other types
      signatureImage = await pdfDoc.embedJpg(sigArrayBuffer);
    }
  } else if (signatureDataUrl) {
    // Convert data URL to image
    const base64Data = signatureDataUrl.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    signatureImage = await pdfDoc.embedPng(bytes);
  }

  if (signatureImage) {
    const sigWidth = 150;
    const scale = sigWidth / signatureImage.width;
    const sigHeight = signatureImage.height * scale;

    // Center the signature
    const sigX = (width - sigWidth) / 2;
    
    reviewPage.drawImage(signatureImage, {
      x: sigX,
      y: cursorY - sigHeight - 10,
      width: sigWidth,
      height: sigHeight,
    });
  } else {
    // If no signature, show placeholder text
    reviewPage.drawText("(No signature provided)", {
      x: 50,
      y: cursorY - 15,
      size: fontSize,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as unknown as ArrayBuffer], { type: "application/pdf" });
}

function wrapText(text: string, maxCharsPerLine: number): string {
  if (!text) return "";
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const w of words) {
    if ((current + " " + w).trim().length > maxCharsPerLine) {
      lines.push(current.trim());
      current = w;
    } else {
      current += " " + w;
    }
  }
  if (current.trim().length) {
    lines.push(current.trim());
  }
  return lines.join("\n");
}

