/**
 * Extracts a single JSON value (object or array) from raw LLM output that may be
 * wrapped in markdown code fences, prefixed/suffixed with prose, or otherwise messy.
 * Throws if no balanced JSON value can be found.
 */
export function extractJsonString(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : raw).trim();

  // Fast path: the whole candidate already parses.
  try {
    JSON.parse(candidate);
    return candidate;
  } catch {
    // fall through to brace/bracket scanning
  }

  const openers = new Set(["{", "["]);
  const closers: Record<string, string> = { "{": "}", "[": "]" };

  for (let start = 0; start < candidate.length; start++) {
    const ch = candidate[start];
    if (!openers.has(ch)) continue;

    const stack: string[] = [ch];
    let inString = false;
    let escaped = false;

    for (let i = start + 1; i < candidate.length; i++) {
      const c = candidate[i];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (c === "\\") {
          escaped = true;
        } else if (c === '"') {
          inString = false;
        }
        continue;
      }

      if (c === '"') {
        inString = true;
        continue;
      }
      if (openers.has(c)) {
        stack.push(c);
        continue;
      }
      if (c === "}" || c === "]") {
        const top = stack[stack.length - 1];
        if (closers[top] !== c) break; // mismatched, abandon this start index
        stack.pop();
        if (stack.length === 0) {
          const slice = candidate.slice(start, i + 1);
          try {
            JSON.parse(slice);
            return slice;
          } catch {
            break; // looked balanced but didn't parse; try next start index
          }
        }
      }
    }
  }

  throw new Error("No valid JSON value found in model output");
}

export function parseJsonLoose<T = unknown>(raw: string): T {
  const jsonString = extractJsonString(raw);
  return JSON.parse(jsonString) as T;
}
