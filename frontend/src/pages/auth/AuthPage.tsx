import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, BadgeIndianRupee, HeartHandshake, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput
} from "@shared/index";
import { Button, GhostButton } from "../../components/Button";
import { Panel } from "../../components/Panel";
import { currency, request } from "../../lib";
import type { Charity, Plan, SessionUser } from "../../lib/types/app";

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-rose-600">{message}</p> : null;
}

const tabClass = (active: boolean) => `rounded-full px-4 py-2.5 text-sm font-semibold transition ${active ? "bg-brand-night text-white shadow-[0_12px_28px_rgba(17,26,42,0.18)]" : "text-slate-600 hover:bg-white hover:text-brand-night"}`;

export function AuthPage({ charities, plans, setSession }: { charities: Charity[]; plans: Plan[]; setSession: (value: SessionUser | null) => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<"register" | "login" | "forgot" | "reset">("register");
  const [pending, setPending] = useState<"login" | "register" | "forgot" | "reset" | null>(null);

  const redirectTo = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return state?.from === "/admin" ? "/admin" : "/dashboard";
  }, [location.state]);

  const loginForm = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const registerForm = useForm<RegisterInput>({ resolver: zodResolver(registerSchema), defaultValues: { fullName: "", email: "", password: "", selectedCharityId: charities[0]?._id ?? "", charityPercentage: 10 } });
  const forgotForm = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });
  const resetForm = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { token: "", password: "" } });

  const handleLogin = loginForm.handleSubmit(async (values) => {
    try {
      setPending("login");
      const response = await request<{ user: SessionUser }>("/auth/login", { method: "POST", body: JSON.stringify(values), useAuth: false });
      setSession(response.user);
      toast.success("Logged in successfully");
      navigate(response.user.role === "admin" && redirectTo === "/admin" ? "/admin" : "/dashboard", { replace: true });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setPending(null);
    }
  });

  const handleRegister = registerForm.handleSubmit(async (values) => {
    try {
      setPending("register");
      const response = await request<{ user: SessionUser }>("/auth/register", { method: "POST", body: JSON.stringify(values), useAuth: false });
      setSession(response.user);
      toast.success("Account created");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setPending(null);
    }
  });

  const handleForgotPassword = forgotForm.handleSubmit(async (values) => {
    try {
      setPending("forgot");
      const response = await request<{ message: string }>("/auth/forgot-password", { method: "POST", body: JSON.stringify(values), useAuth: false });
      toast.success(response.message);
      setMode("reset");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setPending(null);
    }
  });

  const handleResetPassword = resetForm.handleSubmit(async (values) => {
    try {
      setPending("reset");
      const response = await request<{ user: SessionUser }>("/auth/reset-password", { method: "POST", body: JSON.stringify(values), useAuth: false });
      setSession(response.user);
      toast.success("Password reset successful");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setPending(null);
    }
  });

  const activePlan = plans[0];

  return (
    <main className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
      <Panel tone="strong" className="relative overflow-hidden px-7 py-8 sm:px-9 sm:py-10">
        <div className="grid-overlay absolute inset-0 opacity-20" />
        <div className="relative space-y-7">
          <div>
            <span className="inline-flex rounded-full border border-white/14 bg-white/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/72">Join the subscriber experience</span>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">Choose a cause first. The score tracking and monthly draw follow naturally.</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/72">The onboarding flow is designed to keep charity intent visible while still feeling premium, modern, and ready for billing and admin operations.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.6rem] border border-white/10 bg-white/8 p-4">
              <div className="flex items-center gap-2 text-white"><HeartHandshake size={18} /><span className="font-semibold">Pick a charity</span></div>
              <p className="mt-2 text-sm text-white/70">Start with support, not sport.</p>
            </div>
            <div className="rounded-[1.6rem] border border-white/10 bg-white/8 p-4">
              <div className="flex items-center gap-2 text-white"><BadgeIndianRupee size={18} /><span className="font-semibold">Select a plan</span></div>
              <p className="mt-2 text-sm text-white/70">Monthly or yearly entry.</p>
            </div>
            <div className="rounded-[1.6rem] border border-white/10 bg-white/8 p-4">
              <div className="flex items-center gap-2 text-white"><ShieldCheck size={18} /><span className="font-semibold">Stay eligible</span></div>
              <p className="mt-2 text-sm text-white/70">Active subscription unlocks play.</p>
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-white/10 bg-white/10 p-5">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-white/55">Recommended entry point</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xl font-semibold text-white">{activePlan?.name ?? "Starter plan"}</p>
                <p className="mt-1 text-sm text-white/70">Designed for fast onboarding and immediate dashboard access.</p>
              </div>
              <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-night">{activePlan ? currency(activePlan.amountInr) : "Configure plan"}</div>
            </div>
          </div>
        </div>
      </Panel>

      <section className="space-y-5">
        <div className="surface-panel flex flex-wrap gap-2 p-3">
          <GhostButton type="button" className={tabClass(mode === "register")} onClick={() => setMode("register")}>Join now</GhostButton>
          <GhostButton type="button" className={tabClass(mode === "login")} onClick={() => setMode("login")}>Sign in</GhostButton>
          <GhostButton type="button" className={tabClass(mode === "forgot")} onClick={() => setMode("forgot")}>Forgot password</GhostButton>
          <GhostButton type="button" className={tabClass(mode === "reset")} onClick={() => setMode("reset")}>Reset password</GhostButton>
        </div>

        {mode === "register" ? (
          <Panel className="space-y-5">
            <div>
              <span className="eyebrow">Create account</span>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-brand-night">Start with your supporter profile.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Choose the charity that should receive your allocation, then move into billing and draw participation.</p>
            </div>
            <form className="space-y-4" onSubmit={handleRegister}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm text-slate-600">
                  Full name
                  <input {...registerForm.register("fullName")} />
                  <FieldError message={registerForm.formState.errors.fullName?.message} />
                </label>
                <label className="grid gap-2 text-sm text-slate-600">
                  Email
                  <input {...registerForm.register("email")} type="email" />
                  <FieldError message={registerForm.formState.errors.email?.message} />
                </label>
              </div>
              <label className="grid gap-2 text-sm text-slate-600">
                Password
                <input {...registerForm.register("password")} type="password" />
                <FieldError message={registerForm.formState.errors.password?.message} />
              </label>
              <div className="grid gap-4 sm:grid-cols-[1.3fr_0.7fr]">
                <label className="grid gap-2 text-sm text-slate-600">
                  Charity
                  <select {...registerForm.register("selectedCharityId")}>
                    {charities.map((charity) => <option key={charity._id} value={charity._id}>{charity.name}</option>)}
                  </select>
                </label>
                <label className="grid gap-2 text-sm text-slate-600">
                  Charity %
                  <input {...registerForm.register("charityPercentage", { valueAsNumber: true })} type="number" min={10} max={100} />
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button type="submit" size="lg" disabled={pending === "register"}>{pending === "register" ? "Creating..." : <><span>Create account</span><ArrowRight size={16} /></>}</Button>
                <p className="text-sm text-slate-500">You can fine-tune settings from the dashboard later.</p>
              </div>
            </form>
          </Panel>
        ) : null}

        {mode === "login" ? (
          <Panel className="space-y-5">
            <div>
              <span className="eyebrow">Welcome back</span>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-brand-night">Sign in to continue your subscriber journey.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Access your dashboard, latest scores, donation settings, draw participation, and winner claims.</p>
            </div>
            <form className="space-y-4" onSubmit={handleLogin}>
              <label className="grid gap-2 text-sm text-slate-600">
                Email
                <input {...loginForm.register("email")} type="email" />
                <FieldError message={loginForm.formState.errors.email?.message} />
              </label>
              <label className="grid gap-2 text-sm text-slate-600">
                Password
                <input {...loginForm.register("password")} type="password" />
                <FieldError message={loginForm.formState.errors.password?.message} />
              </label>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button type="submit" size="lg" disabled={pending === "login"}>{pending === "login" ? "Signing in..." : "Sign in"}</Button>
                <GhostButton type="button" onClick={() => setMode("forgot")}>Need password help?</GhostButton>
              </div>
            </form>
          </Panel>
        ) : null}

        {mode === "forgot" ? (
          <Panel className="space-y-5">
            <div>
              <span className="eyebrow">Password recovery</span>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-brand-night">Request password reset instructions.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Submit your email and follow the reset instructions delivered by the configured mail provider.</p>
            </div>
            <form className="space-y-4" onSubmit={handleForgotPassword}>
              <label className="grid gap-2 text-sm text-slate-600">
                Email
                <input {...forgotForm.register("email")} type="email" />
                <FieldError message={forgotForm.formState.errors.email?.message} />
              </label>
              <Button type="submit" size="lg" disabled={pending === "forgot"}>{pending === "forgot" ? "Submitting..." : "Send reset instructions"}</Button>
            </form>
          </Panel>
        ) : null}

        {mode === "reset" ? (
          <Panel className="space-y-5">
            <div>
              <span className="eyebrow">Reset access</span>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-brand-night">Set a fresh password and return to the dashboard.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Enter the reset token from your email, then confirm the new password.</p>
            </div>
            <form className="space-y-4" onSubmit={handleResetPassword}>
              <label className="grid gap-2 text-sm text-slate-600">
                Reset token
                <input className="font-mono" {...resetForm.register("token")} />
                <FieldError message={resetForm.formState.errors.token?.message} />
              </label>
              <label className="grid gap-2 text-sm text-slate-600">
                New password
                <input {...resetForm.register("password")} type="password" />
                <FieldError message={resetForm.formState.errors.password?.message} />
              </label>
              <Button type="submit" size="lg" disabled={pending === "reset"}>{pending === "reset" ? "Resetting..." : "Reset password"}</Button>
            </form>
          </Panel>
        ) : null}
      </section>
    </main>
  );
}


