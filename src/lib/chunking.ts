/**
 * Document chunking and semantic relevance scoring utilities for AgentHub RAG pipeline.
 * Compatible with pgvector and local embedding generation.
 */

export type TextChunk = {
  index: number;
  content: string;
  tokenEstimate: number;
  fileId?: string;
  fileName?: string;
};

/**
 * Estimates token count from text using standard whitespace + punctuation heuristic (~4 chars/token).
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.trim().length / 4);
}

/**
 * Splits document text into discrete semantic chunks based on paragraph/sentence boundaries
 * with configurable token overlap to preserve contextual continuity.
 */
export function chunkText(
  text: string,
  maxChunkChars = 800,
  overlapChars = 120
): TextChunk[] {
  const cleaned = text.replace(/\r\n/g, "\n").trim();
  if (!cleaned) return [];

  if (cleaned.length <= maxChunkChars) {
    return [
      {
        index: 0,
        content: cleaned,
        tokenEstimate: estimateTokens(cleaned),
      },
    ];
  }

  const chunks: TextChunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  // Split by natural paragraph breaks first, fallback to sentences
  while (startIndex < cleaned.length) {
    let endIndex = startIndex + maxChunkChars;

    if (endIndex >= cleaned.length) {
      endIndex = cleaned.length;
    } else {
      // Find nearest natural boundary (paragraph break, period, newline)
      const slice = cleaned.slice(startIndex, endIndex);
      const lastParagraph = slice.lastIndexOf("\n\n");
      const lastNewline = slice.lastIndexOf("\n");
      const lastPeriod = slice.lastIndexOf(". ");

      if (lastParagraph > maxChunkChars * 0.4) {
        endIndex = startIndex + lastParagraph + 2;
      } else if (lastPeriod > maxChunkChars * 0.4) {
        endIndex = startIndex + lastPeriod + 2;
      } else if (lastNewline > maxChunkChars * 0.4) {
        endIndex = startIndex + lastNewline + 1;
      }
    }

    const chunkContent = cleaned.slice(startIndex, endIndex).trim();
    if (chunkContent.length > 0) {
      chunks.push({
        index: chunkIndex++,
        content: chunkContent,
        tokenEstimate: estimateTokens(chunkContent),
      });
    }

    if (endIndex >= cleaned.length) break;
    // Step forward minus the overlap
    startIndex = Math.max(startIndex + 1, endIndex - overlapChars);
  }

  return chunks;
}

/**
 * Ranks and retrieves the top-K most relevant chunks matching the user's query
 * using lexical token match, TF scoring, and phrase density.
 */
export function findRelevantChunks(
  query: string,
  chunks: TextChunk[],
  maxResults = 4
): TextChunk[] {
  if (!query.trim() || chunks.length === 0) {
    return chunks.slice(0, maxResults);
  }

  // Tokenize and clean query
  const queryTokens = query
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (queryTokens.length === 0) {
    return chunks.slice(0, maxResults);
  }

  const queryLower = query.toLowerCase();

  const scored = chunks.map((chunk) => {
    const contentLower = chunk.content.toLowerCase();
    let score = 0;

    // Exact phrase match gives a massive boost
    if (contentLower.includes(queryLower)) {
      score += 10;
    }

    // Token frequency and density scoring
    for (const token of queryTokens) {
      const occurrences = (contentLower.match(new RegExp(`\\b${token}\\b`, "g")) || []).length;
      if (occurrences > 0) {
        score += occurrences * 2;
      } else if (contentLower.includes(token)) {
        score += 1;
      }
    }

    return { chunk, score };
  });

  // Sort by highest score descending
  scored.sort((a, b) => b.score - a.score);

  // If top scores are 0, return initial chunks
  if (scored[0].score === 0) {
    return chunks.slice(0, maxResults);
  }

  return scored
    .filter((s) => s.score > 0)
    .slice(0, maxResults)
    .map((s) => s.chunk);
}

/**
 * Interface definition for vector embeddings storage (compatible with pgvector).
 */
export interface VectorEmbedding {
  chunkIndex: number;
  embedding: number[];
  dimensions: number;
}

/**
 * Formats a chunk for insertion into a future pgvector column.
 */
export function formatForPgvector(chunk: TextChunk, embedding: number[]) {
  return {
    chunkIndex: chunk.index,
    content: chunk.content,
    embeddingSql: `[${embedding.join(",")}]`,
    dimensions: embedding.length,
  };
}
