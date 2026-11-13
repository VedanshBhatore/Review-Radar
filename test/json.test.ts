import { describe, expect, it } from "vitest";
import { extractJsonString, parseJsonLoose } from "@/lib/json";

describe("extractJsonString", () => {
  it("extracts plain JSON unchanged", () => {
    const raw = '{"a":1}';
    expect(extractJsonString(raw)).toBe(raw);
  });

  it("extracts JSON from a fenced ```json block", () => {
    const raw = 'Here you go:\n```json\n{"a": 1, "b": [1,2,3]}\n```\nHope that helps!';
    expect(JSON.parse(extractJsonString(raw))).toEqual({ a: 1, b: [1, 2, 3] });
  });

  it("extracts JSON from a fenced block without the json tag", () => {
    const raw = '```\n{"a": 1}\n```';
    expect(JSON.parse(extractJsonString(raw))).toEqual({ a: 1 });
  });

  it("extracts JSON embedded in surrounding prose", () => {
    const raw = 'Sure, here is the result: {"themes": [{"name": "Bug"}]} let me know if you need more.';
    expect(JSON.parse(extractJsonString(raw))).toEqual({ themes: [{ name: "Bug" }] });
  });

  it("handles nested braces and brackets correctly", () => {
    const raw = 'blah {"a": {"b": [1, {"c": 2}]}} trailing junk {not json';
    expect(JSON.parse(extractJsonString(raw))).toEqual({ a: { b: [1, { c: 2 }] } });
  });

  it("handles braces inside string values without miscounting", () => {
    const raw = '{"text": "a note with a } brace and a { opener inside"}';
    expect(JSON.parse(extractJsonString(raw))).toEqual({
      text: "a note with a } brace and a { opener inside",
    });
  });

  it("handles escaped quotes inside strings", () => {
    const raw = String.raw`{"text": "he said \"hi\""}`;
    expect(JSON.parse(extractJsonString(raw))).toEqual({ text: 'he said "hi"' });
  });

  it("extracts a top-level JSON array", () => {
    const raw = "some text [1, 2, 3] more text";
    expect(JSON.parse(extractJsonString(raw))).toEqual([1, 2, 3]);
  });

  it("throws when there is no JSON in the input", () => {
    expect(() => extractJsonString("no json here at all")).toThrow();
  });

  it("skips an unbalanced opener and finds the next valid JSON value", () => {
    const raw = '{ this is not json "a": } {"valid": true}';
    expect(JSON.parse(extractJsonString(raw))).toEqual({ valid: true });
  });
});

describe("parseJsonLoose", () => {
  it("parses directly to a typed value", () => {
    const result = parseJsonLoose<{ a: number }>('```json\n{"a": 42}\n```');
    expect(result.a).toBe(42);
  });
});
