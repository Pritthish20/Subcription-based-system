import { getEnv, sendEmail } from "../config";
import { runService } from "../lib/http";
import { NotificationLog, User } from "../models";
import { createEmailTemplate, type EmailTemplate } from "../utils/email-template";
import { logError, logInfo } from "../utils/logger";

function formatDate(value: unknown) {
  if (!value) return "Unavailable";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function displayNumbers(numbers: unknown) {
  return Array.isArray(numbers) && numbers.length ? numbers.join(", ") : "To be announced";
}

function templateFor(event: string, payload: any, appUrl: string, recipientName?: string): EmailTemplate {
  const greeting = recipientName ? `${recipientName},` : "There,";

  switch (event) {
    case "auth.registered":
      return createEmailTemplate({
        subject: "Welcome to Club & Cause",
        eyebrow: "Account ready",
        title: "Your account is live",
        intro: `${greeting} your account is ready and your dashboard is waiting.`,
        bodyLines: [
          "Finish your subscription setup, choose the charity you want to back, and start entering your latest Stableford scores.",
          "Once subscribed, every active month feeds both the monthly draw and your selected charity allocation."
        ],
        ctaLabel: "Open dashboard",
        ctaUrl: `${appUrl}/dashboard`
      });
    case "auth.password_reset_requested":
      return createEmailTemplate({
        subject: "Password reset instructions",
        eyebrow: "Security action",
        title: "Reset your password",
        intro: `${greeting} we received a request to reset your password.`,
        bodyLines: [
          "Use the token below in the reset form to complete the change.",
          "If you did not request this, you can ignore this message and your current password will remain valid."
        ],
        metaRows: [
          { label: "Reset token", value: payload?.resetToken ?? "Unavailable" },
          { label: "Expires", value: formatDate(payload?.expiresAt) }
        ],
        ctaLabel: "Go to reset form",
        ctaUrl: `${appUrl}/auth`
      });
    case "auth.password_reset_completed":
      return createEmailTemplate({
        subject: "Your password has been reset",
        eyebrow: "Security confirmed",
        title: "Password updated successfully",
        intro: `${greeting} your password was reset successfully.`,
        bodyLines: [
          "You can sign back in immediately with the new password.",
          "If this was not you, update your password again and review your account activity."
        ],
        ctaLabel: "Sign in again",
        ctaUrl: `${appUrl}/auth`
      });
    case "subscription.activated":
      return createEmailTemplate({
        subject: "Subscription activated",
        eyebrow: "Subscription active",
        title: "You are live in this month’s draw cycle",
        intro: `${greeting} your subscription is now active.`,
        bodyLines: [
          "You can enter your latest five scores, review your charity percentage, and track upcoming draw participation from the dashboard.",
          "Keep your score history current to stay ready for monthly operations and winner verification."
        ],
        metaRows: payload?.planName ? [{ label: "Plan", value: payload.planName }] : undefined,
        ctaLabel: "Open dashboard",
        ctaUrl: `${appUrl}/dashboard`
      });
    case "donation.created":
      return createEmailTemplate({
        subject: "Donation recorded",
        eyebrow: "Contribution confirmed",
        title: "Your donation has been logged",
        intro: `${greeting} your independent donation was recorded successfully.`,
        bodyLines: [
          "Thank you for supporting impact beyond your gameplay participation.",
          "Your contribution is now reflected in the platform’s charity reporting ledger."
        ],
        metaRows: [
          { label: "Amount", value: payload?.amountInr ? `INR ${payload.amountInr}` : "Recorded" },
          { label: "Charity", value: payload?.charityName ?? "Selected charity" }
        ],
        ctaLabel: "Review dashboard",
        ctaUrl: `${appUrl}/dashboard`
      });
    case "draw.published":
      return createEmailTemplate({
        subject: `Monthly draw published: ${payload?.month ?? "Latest result"}`,
        eyebrow: "Results published",
        title: `The ${payload?.month ?? "latest"} draw is now live`,
        intro: `${greeting} the latest draw has been published and the official numbers are ready to review.`,
        bodyLines: [
          "Open the results page to compare the draw against your latest score profile and check any pending winner actions.",
          "If you are selected as a winner, your dashboard will guide you through proof submission and payout tracking."
        ],
        metaRows: [
          { label: "Month", value: payload?.month ?? "Current cycle" },
          { label: "Official numbers", value: displayNumbers(payload?.numbers) },
          { label: "Rollover", value: payload?.rolloverAmount ? `INR ${payload.rolloverAmount}` : "No rollover" }
        ],
        ctaLabel: "View draw results",
        ctaUrl: `${appUrl}/draws/results`
      });
    case "winner.approved":
      return createEmailTemplate({
        subject: "Winner proof approved",
        eyebrow: "Claim approved",
        title: "Your winner proof is approved",
        intro: `${greeting} your claim has passed review.`,
        bodyLines: [
          "Your payout is now ready for the final processing step.",
          "Keep an eye on your dashboard for the payout status and final confirmation."
        ],
        ctaLabel: "View claim status",
        ctaUrl: `${appUrl}/dashboard`
      });
    case "winner.rejected":
      return createEmailTemplate({
        subject: "Winner proof rejected",
        eyebrow: "Claim update",
        title: "Your winner proof needs attention",
        intro: `${greeting} your submitted winner proof was rejected during admin review.`,
        bodyLines: [
          "Open the dashboard to review the current claim status and any notes recorded during the review process.",
          "You may need to re-submit clearer evidence depending on the claim state shown there."
        ],
        ctaLabel: "Open dashboard",
        ctaUrl: `${appUrl}/dashboard`
      });
    case "winner.paid":
      return createEmailTemplate({
        subject: "Winner payout completed",
        eyebrow: "Payout completed",
        title: "Your payout has been marked as paid",
        intro: `${greeting} your winning payout is now complete.`,
        bodyLines: [
          "The dashboard now reflects the final payout state for this claim.",
          "Keep your claim history for your own records and future draw participation."
        ],
        metaRows: [
          { label: "Reference", value: payload?.reference ?? "Recorded internally" },
          { label: "Paid at", value: formatDate(payload?.paidAt) }
        ],
        ctaLabel: "Review dashboard",
        ctaUrl: `${appUrl}/dashboard`
      });
    default:
      return createEmailTemplate({
        subject: `Platform update: ${event}`,
        eyebrow: "Platform update",
        title: "There is a new update on your account",
        intro: `${greeting} a new platform event was recorded for your account.`,
        bodyLines: ["Review your dashboard for the latest status, draw participation, and account activity."],
        ctaLabel: "Open dashboard",
        ctaUrl: `${appUrl}/dashboard`
      });
  }
}

export async function notify(userId: string | undefined, event: string, payload: unknown) {
  return runService("notification.service", "notify", async () => {
    const env = getEnv();
    const user = userId ? await User.findById(userId) : null;
    const recipient = user?.email;
    const template = templateFor(event, payload, env.APP_URL, user?.fullName);

    const log = await NotificationLog.create({
      userId,
      channel: "email",
      recipient,
      subject: template.subject,
      event,
      payload,
      status: recipient ? "queued" : "skipped",
      provider: env.EMAIL_PROVIDER
    });

    if (!recipient) {
      logInfo("Notification skipped without recipient", { event, userId, notificationId: log._id.toString() });
      return log;
    }

    try {
      const delivery = await sendEmail({
        to: recipient,
        subject: template.subject,
        text: template.text,
        html: template.html
      });

      log.status = "sent";
      log.provider = delivery.provider;
      log.providerMessageId = delivery.messageId;
      log.sentAt = new Date();
      await log.save();

      logInfo("Notification sent", { event, userId, recipient, provider: delivery.provider, notificationId: log._id.toString() });
      return log;
    } catch (error) {
      log.status = "failed";
      log.errorMessage = (error as Error).message;
      await log.save();

      logError("Notification delivery failed", { event, userId, recipient, notificationId: log._id.toString(), error: (error as Error).message });
      return log;
    }
  });
}

export async function notifyMany(userIds: string[], event: string, payload: unknown) {
  return Promise.allSettled(userIds.map((userId) => notify(userId, event, payload)));
}

