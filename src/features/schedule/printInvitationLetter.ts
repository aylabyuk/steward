import type { Speaker } from "@/lib/types";

export function printInvitationLetter(speaker: Speaker, sundayDate: string): void {
  const dateObj = new Date(sundayDate);
  const formattedDate = dateObj.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const today = new Date();
  const dayCount = Math.ceil((dateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Speaker Invitation - ${speaker.name}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
          color: #231815;
        }
        h1 { font-size: 28px; margin-bottom: 20px; }
        p { margin-bottom: 16px; }
        .meta { font-size: 14px; color: #5a4636; margin-top: 40px; }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <p>Dear ${speaker.name},</p>

      <p>The bishopric invites you to speak in sacrament meeting on Sunday, <strong>${formattedDate}</strong> (${dayCount} days away).</p>

      <p><strong>Topic:</strong> ${speaker.topic ?? "(To be determined)"}</p>
      <p><strong>Duration:</strong> 10–15 minutes</p>

      <p>Please let us know if this date doesn't work, and we'll find another time for you to speak.</p>

      <p>Thank you!</p>

      <div class="meta">
        <p><em>Speaker Invitation — ${sundayDate}</em></p>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
}
