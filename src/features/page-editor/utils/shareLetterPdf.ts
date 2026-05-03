/** Hands a generated letter PDF to the OS share sheet (Web Share API)
 *  when files are supported, otherwise triggers a plain download. The
 *  share path lets the bishop route the letter through any installed
 *  app (iMessage, WhatsApp, AirDrop, Mail, Files-as-PDF) without
 *  surfacing the invitation's capability link, so there's no path
 *  for a fake speaker response.
 *
 *  Returns which path actually fired so callers can adjust UI copy
 *  ("Letter shared" vs. "Letter downloaded"). */
export async function shareLetterPdf(
  file: File,
  filename: string,
  title: string,
): Promise<"shared" | "downloaded"> {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] }) &&
    typeof navigator.share === "function"
  ) {
    try {
      await navigator.share({ files: [file], title });
      return "shared";
    } catch (err) {
      // User cancelled the OS share sheet — treat as success-no-op so
      // the wizard still progresses to the post-share confirm. Any
      // other error falls through to the download fallback.
      if (err instanceof DOMException && err.name === "AbortError") return "shared";
    }
  }
  downloadFile(file, filename);
  return "downloaded";
}

/** Triggers a plain browser download. Exported so callers that
 *  explicitly want a download (desktop "Download letter" affordance)
 *  can bypass the share-sheet round-trip in `shareLetterPdf`. */
export function downloadFile(file: File, filename: string): void {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Defer revoke so the click has time to fire on slow browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
