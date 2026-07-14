// Parse streaming responses
export function parseStreamChunk(chunk: string): unknown {
  try {
    return JSON.parse(chunk);
  } catch {
    return null;
  }
}

// Accumulate streaming text
export function accumulateStreamText(
  accumulator: string,
  newText: string
): string {
  return accumulator + newText;
}

// Detect if text is complete (for ending streams)
export function isStreamComplete(text: string): boolean {
  return text.endsWith('\n') || text.endsWith(' ') || text.endsWith('.');
}

// Clean up incomplete words at end of stream
export function cleanupIncompleteText(text: string): string {
  return text.trim();
}
