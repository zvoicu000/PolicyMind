declare module "pdf-parse" {
  import type { Buffer } from "node:buffer";

  export interface PdfParseResult {
    text: string;
    info?: unknown;
    metadata?: unknown;
    version?: string;
  }

  export default function pdfParse(data: Buffer | Uint8Array, options?: unknown): Promise<PdfParseResult>;
}
