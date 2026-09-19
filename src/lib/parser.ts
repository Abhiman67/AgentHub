import JSZip from "jszip";
import pako from "pako";

/**
 * Extracts raw textual content from an uploaded DOCX file (ZIP containing word/document.xml).
 */
export async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const docXml = await zip.file("word/document.xml")?.async("string");
    if (!docXml) return "";
    return docXml
      .replace(/<w:p[^>]*>/g, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.warn("DOCX parse error:", err);
    return "";
  }
}

/**
 * Extracts textual content from PDF buffers by inspecting text streams.
 */
export async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  try {
    const bytes = new Uint8Array(buffer);
    const latinText = new TextDecoder("latin1").decode(bytes);

    const streams: string[] = [];
    const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
    let match;

    while ((match = streamRegex.exec(latinText)) !== null) {
      const rawStream = match[1];
      try {
        const streamBytes = new Uint8Array(rawStream.length);
        for (let i = 0; i < rawStream.length; i++) {
          streamBytes[i] = rawStream.charCodeAt(i);
        }
        const decompressed = pako.inflate(streamBytes, { to: "string" });
        streams.push(decompressed);
      } catch {
        streams.push(rawStream);
      }
    }

    const fullStreamText = streams.join("\n");
    const textChunks: string[] = [];

    // Extract text in parenthesis: (hello) Tj or '
    const tjRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
    while ((match = tjRegex.exec(fullStreamText)) !== null) {
      textChunks.push(match[1]);
    }

    // Extract text in array blocks: [(hello) 10 (world)] TJ
    const arrayTjRegex = /\[(.*?)\]\s*TJ/g;
    while ((match = arrayTjRegex.exec(fullStreamText)) !== null) {
      const inner = match[1];
      const innerRegex = /\(([^)]+)\)/g;
      let innerMatch;
      while ((innerMatch = innerRegex.exec(inner)) !== null) {
        textChunks.push(innerMatch[1]);
      }
    }

    if (textChunks.length > 5) {
      return textChunks.join(" ").replace(/\s+/g, " ").trim();
    }

    // Fallback: extract continuous legible words (min 4 chars)
    const legible = latinText.match(/[A-Za-z0-9 ,.?!'"\-:;]{4,}/g);
    if (legible && legible.length > 5) {
      return legible.filter((s) => !s.includes("obj") && !s.includes("endobj")).join(" ").slice(0, 10000);
    }

    return "";
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.warn("PDF parse error:", err);
    return "";
  }
}
