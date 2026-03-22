import bcrypt from "bcryptjs";
import { getEnv } from "../config";
import { runService } from "../lib/http";
import { Charity, Plan, User } from "../models";

export async function ensureDefaultPlans() {
  return runService("seed.service", "ensureDefaultPlans", async () => {
    const env = getEnv();
    if ((await Plan.countDocuments()) > 0) return;

    await Plan.insertMany([
      {
        name: "Monthly Hero Pass",
        interval: "monthly",
        amountInr: 1499,
        charityDefaultPercentage: 10,
        prizePoolContributionPercentage: 40,
        paymentProvider: "razorpay",
        providerPlanId: env.RAZORPAY_MONTHLY_PLAN_ID
      },
      {
        name: "Yearly Hero Pass",
        interval: "yearly",
        amountInr: 14999,
        charityDefaultPercentage: 10,
        prizePoolContributionPercentage: 40,
        paymentProvider: "razorpay",
        providerPlanId: env.RAZORPAY_YEARLY_PLAN_ID
      }
    ]);
  });
}

export async function ensureSeedData() {
  return runService("seed.service", "ensureSeedData", async () => {
    if ((await Charity.countDocuments()) === 0) {
      await Charity.insertMany([
        {
          name: "First Swing Foundation",
          slug: "first-swing-foundation",
          description: "Funds junior golf access, coaching scholarships, and transport for underrepresented young players.",
          category: "Junior Access",
          featured: true,
          imageUrl: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=80",
          events: [{ title: "Community Golf Day", startsAt: new Date(), location: "Bengaluru" }]
        },
        {
          name: "Fairways For Care",
          slug: "fairways-for-care",
          description: "Supports mobile health camps and golf-day fundraising for families needing long-term treatment.",
          category: "Health Outreach",
          featured: false,
          imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
          events: []
        }
      ]);
    }

    if (!(await User.findOne({ role: "admin" }))) {
      const charities = await Charity.find().sort({ createdAt: 1 });
      await User.create({
        fullName: "Platform Admin",
        email: "admin@digitalheroes.demo",
        passwordHash: await bcrypt.hash("Admin@123456", 12),
        role: "admin",
        accountState: "active",
        selectedCharityId: charities[0]?._id,
        charityPercentage: 10
      });
    }
  });
}
