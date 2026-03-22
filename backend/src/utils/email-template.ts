type EmailTemplateInput = {
  subject: string;
  eyebrow: string;
  title: string;
  intro: string;
  bodyLines?: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  metaRows?: Array<{ label: string; value: string }>;
  footerNote?: string;
};

export type EmailTemplate = {
  subject: string;
  text: string;
  html: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderMetaRows(metaRows: Array<{ label: string; value: string }>) {
  if (!metaRows.length) return "";

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;border-collapse:separate;border-spacing:0 12px;">
      ${metaRows
        .map(
          (row) => `
            <tr>
              <td style="width:32%;padding:12px 14px;border-radius:14px 0 0 14px;background:#eef7f6;color:#0f172a;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">${escapeHtml(row.label)}</td>
              <td style="padding:12px 14px;border-radius:0 14px 14px 0;background:#f8fafc;color:#334155;font-size:14px;">${escapeHtml(row.value)}</td>
            </tr>`
        )
        .join("")}
    </table>`;
}

export function createEmailTemplate(input: EmailTemplateInput): EmailTemplate {
  const bodyLines = input.bodyLines ?? [];
  const metaRows = input.metaRows ?? [];
  const footerNote = input.footerNote ?? "This is an automated update from Golf Charity Subscription Platform.";
  const safeCtaUrl = input.ctaUrl ? escapeHtml(input.ctaUrl) : undefined;
  const safeCtaLabel = input.ctaLabel ? escapeHtml(input.ctaLabel) : undefined;

  const textSections = [
    input.title,
    input.intro,
    ...bodyLines,
    ...metaRows.map((row) => `${row.label}: ${row.value}`),
    input.ctaLabel && input.ctaUrl ? `${input.ctaLabel}: ${input.ctaUrl}` : undefined,
    footerNote
  ].filter(Boolean);

  const html = `
  <div style="margin:0;padding:32px 16px;background:linear-gradient(180deg,#f4efe3 0%,#eef7f6 100%);font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;border-collapse:separate;border-spacing:0;background:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 24px 72px rgba(15,23,42,0.12);">
      <tr>
        <td style="padding:24px 28px;background:#0f766e;color:#ecfeff;">
          <div style="font-size:12px;font-weight:800;letter-spacing:0.24em;text-transform:uppercase;opacity:0.92;">${escapeHtml(input.eyebrow)}</div>
          <div style="margin-top:10px;font-size:28px;line-height:1.2;font-weight:900;">${escapeHtml(input.title)}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:28px;">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#334155;">${escapeHtml(input.intro)}</p>
          ${bodyLines.map((line) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#475569;">${escapeHtml(line)}</p>`).join("")}
          ${renderMetaRows(metaRows)}
          ${safeCtaUrl && safeCtaLabel ? `<div style="margin-top:28px;"><a href="${safeCtaUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#ea580c;color:#fff7ed;font-weight:800;font-size:14px;letter-spacing:0.02em;text-decoration:none;">${safeCtaLabel}</a></div>` : ""}
        </td>
      </tr>
      <tr>
        <td style="padding:20px 28px;border-top:1px solid #e2e8f0;background:#f8fafc;color:#64748b;font-size:12px;line-height:1.7;">${escapeHtml(footerNote)}</td>
      </tr>
    </table>
  </div>`;

  return {
    subject: input.subject,
    text: textSections.join("\n\n"),
    html
  };
}
