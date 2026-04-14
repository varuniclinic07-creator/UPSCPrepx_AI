// Type declarations for optional external modules used in dynamic imports

declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
    info: Record<string, unknown>;
  }
  function pdfParse(buffer: Buffer): Promise<PDFData>;
  export default pdfParse;
}

declare module 'mammoth' {
  interface ConversionResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }
  export function extractRawText(options: { buffer: Buffer }): Promise<ConversionResult>;
  export function convertToHtml(options: { buffer: Buffer }): Promise<ConversionResult>;
}

declare module 'officeparser' {
  export function parseOfficeAsync(buffer: Buffer): Promise<string>;
}
