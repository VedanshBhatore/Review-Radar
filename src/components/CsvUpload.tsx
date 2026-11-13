"use client";

import Papa from "papaparse";
import { useId, useState } from "react";
import { reviewsFromCsvRows } from "@/lib/csv";
import type { Review } from "@/lib/types";
import { Button } from "./ui/Button";

interface CsvUploadProps {
  onParsed: (appName: string, reviews: Review[]) => void;
  disabled?: boolean;
}

export function CsvUpload({ onParsed, disabled }: CsvUploadProps) {
  const [appName, setAppName] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedReviews, setParsedReviews] = useState<Review[] | null>(null);
  const [skipped, setSkipped] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const appNameId = useId();
  const fileId = useId();

  function handleFile(file: File) {
    setError(null);
    setFileName(file.name);
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          setError("That CSV has no rows. Expected columns: text, rating, date.");
          setParsedReviews(null);
          return;
        }
        const { reviews, skipped: skippedCount } = reviewsFromCsvRows(results.data);
        if (reviews.length === 0) {
          setError(
            "Couldn't find any valid rows. Make sure the CSV has text, rating (1-5), and date columns.",
          );
          setParsedReviews(null);
          return;
        }
        setParsedReviews(reviews);
        setSkipped(skippedCount);
      },
      error: () => {
        setError("Couldn't read that file. Make sure it's a valid CSV.");
        setParsedReviews(null);
      },
    });
  }

  const canSubmit = Boolean(appName.trim() && parsedReviews && parsedReviews.length > 0);

  return (
    <div className="rounded-xl border border-border bg-surface-muted p-4 text-sm">
      <p className="mb-3 font-medium">Or upload your own reviews as CSV</p>
      <p className="mb-3 text-foreground-muted">
        Columns: <code className="rounded bg-surface px-1 py-0.5">text</code>,{" "}
        <code className="rounded bg-surface px-1 py-0.5">rating</code> (1-5),{" "}
        <code className="rounded bg-surface px-1 py-0.5">date</code>. Parsed entirely in your
        browser -- nothing is uploaded anywhere.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor={appNameId} className="mb-1 block text-xs font-medium text-foreground-muted">
            App name
          </label>
          <input
            id={appNameId}
            type="text"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="My App"
            disabled={disabled}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand"
          />
        </div>
        <div className="flex-1">
          <label htmlFor={fileId} className="mb-1 block text-xs font-medium text-foreground-muted">
            CSV file
          </label>
          <input
            id={fileId}
            type="file"
            accept=".csv,text/csv"
            disabled={disabled}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm outline-none file:mr-2 file:rounded-md file:border-0 file:bg-brand file:px-2 file:py-1 file:text-xs file:text-white focus-visible:ring-2 focus-visible:ring-brand"
          />
        </div>
        <Button
          variant="secondary"
          disabled={!canSubmit || disabled}
          onClick={() => parsedReviews && onParsed(appName.trim(), parsedReviews)}
        >
          Use this file
        </Button>
      </div>

      {fileName && parsedReviews && (
        <p className="mt-2 text-xs text-good">
          Parsed {parsedReviews.length} review{parsedReviews.length === 1 ? "" : "s"} from {fileName}
          {skipped > 0 ? ` (skipped ${skipped} invalid row${skipped === 1 ? "" : "s"})` : ""}.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
