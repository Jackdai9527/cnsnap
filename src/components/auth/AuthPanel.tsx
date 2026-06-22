"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useMemo, useState } from "react";
import { ArrowLeft, Github, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { buildLocalizedUiHref } from "@/lib/i18n/frontend-routing";
import { getSeoLocaleByAppLocale, type FrontendLocale } from "../../../config/i18n";

type AuthPanelProps = {
  mode: "login" | "register";
  enabledProviders: string[];
  defaultCallbackUrl?: string;
  compact?: boolean;
  loginMode?: "user" | "admin";
};

const providerLabels: Record<string, string> = {
  apple: "Apple",
  google: "Google",
  facebook: "Facebook",
  discord: "Discord",
  github: "GitHub",
  email: "Email Link"
};

export function AuthPanel({
  mode,
  enabledProviders,
  defaultCallbackUrl = "/account",
  compact = false,
  loginMode = "user"
}: AuthPanelProps) {
  const t = useTranslations("AuthPage");
  const locale = useLocale() as FrontendLocale;
  const publicLocale = getSeoLocaleByAppLocale(locale) || undefined;
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || defaultCallbackUrl;
  const loginError = searchParams.get("error");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const socialProviders = useMemo(() => enabledProviders.filter((provider) => provider !== "credentials" && provider !== "email"), [enabledProviders]);
  const loginHref = buildLocalizedUiHref("/login", locale, undefined, publicLocale);
  const registerHref = buildLocalizedUiHref("/register", locale, undefined, publicLocale);
  const emailMagicEnabled = enabledProviders.includes("email");
  const credentialsEnabled = enabledProviders.includes("credentials");
  const emailOnlyEnabled = emailMagicEnabled && !credentialsEnabled;
  const displayedMessage = loginError === "account_blocked" && !message
    ? t("messages.accountBlocked")
    : message;
  const socialTitle = mode === "login" ? t("login.title") : t("register.title");
  const socialEyebrow = mode === "login" ? t("login.eyebrow") : t("register.eyebrow");
  const mobileHighlights = [
    {
      key: "orders",
      icon: UserRound,
      label: "Orders and packages stay in one workspace"
    },
    {
      key: "wallet",
      icon: ShieldCheck,
      label: "Wallet, checkout, and support stay connected"
    }
  ];

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");

    if (mode === "register") {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setMessage(payload.error ?? t("messages.registrationFailed"));
        setPending(false);
        return;
      }
    }

    if (mode === "login" && loginMode === "admin") {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, callbackUrl })
      });
      const payload = await response.json().catch(() => ({})) as { error?: string; callbackUrl?: string };
      setPending(false);
      if (response.ok) {
        router.push(payload.callbackUrl || callbackUrl);
        router.refresh();
        return;
      }
      setMessage(payload.error ?? t("messages.invalidAdminCredentials"));
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false
    });

    setPending(false);
    if (result?.ok) {
      router.push(callbackUrl);
      router.refresh();
      return;
    }

    setMessage(
      result?.error === "AccessDenied"
        ? t("messages.accountBlocked")
        : mode === "register"
          ? t("messages.autoSignInFailed")
          : t("messages.invalidCredentials")
    );
  }

  async function sendMagicLink() {
    setPending(true);
    setMessage("");
    const result = await signIn("email", {
      email,
      callbackUrl,
      redirect: false
    });
    setPending(false);
    setMessage(result?.ok ? t("messages.magicLinkSent") : t("messages.magicLinkFailed"));
  }

  return (
    <div className={compact ? "" : "site-container auth-shell grid min-h-[calc(100vh-170px)] items-center gap-8 py-10 lg:grid-cols-[1fr_440px]"}>
      {!compact ? (
        <section className="hidden lg:block">
          <div className="label">{t("panel.kicker")}</div>
          <h1 className="mt-4 max-w-xl text-5xl font-black leading-tight tracking-tight text-[#111827]">
            {t("panel.title")}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-[#667085]">
            {t("panel.description")}
          </p>
        </section>
      ) : null}

      <section className="site-card auth-card p-6">
        <div className="auth-mobile-top md:hidden">
          <button type="button" className="auth-mobile-back" onClick={() => window.history.back()} aria-label="Go back">
            <ArrowLeft size={18} />
          </button>
          <div className="auth-mobile-heading">
            <div className="auth-mobile-kicker">{socialEyebrow}</div>
            <div className="auth-mobile-title">{socialTitle}</div>
            <div className="auth-mobile-copy">{t("panel.description")}</div>
          </div>
        </div>

        <div className="auth-mobile-highlights md:hidden">
          {mobileHighlights.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.key} className="auth-mobile-highlight-card">
                <span className="auth-mobile-highlight-icon">
                  <Icon size={16} />
                </span>
                <span className="auth-mobile-highlight-copy">{item.label}</span>
              </div>
            );
          })}
        </div>

        <div className="mb-5 auth-card-header">
          <div className="text-sm font-bold text-[#667085] auth-card-eyebrow">{socialEyebrow}</div>
          <h2 className="mt-1 text-3xl font-black text-[#111827] auth-card-title">{socialTitle}</h2>
        </div>

        {socialProviders.length ? (
          <div className="grid gap-2 sm:grid-cols-2 auth-social-grid">
            {socialProviders.map((provider) => (
              <button
                key={provider}
                type="button"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#d9e7ff] bg-white px-3 text-sm font-bold text-[#111827] hover:border-[#e60012] hover:text-[#e60012] auth-social-btn"
                onClick={() => signIn(provider, { callbackUrl })}
              >
                {providerIcon(provider)}
                {providerLabels[provider] ?? provider}
              </button>
            ))}
          </div>
        ) : null}

        {credentialsEnabled ? (
          <>
            {socialProviders.length ? <div className="my-5 h-px bg-[#d9e7ff]" /> : null}
            <form className="space-y-3 auth-form" onSubmit={submit}>
              {mode === "register" ? (
                <label className="block auth-field">
                  <span className="mb-1 block text-sm font-bold text-[#667085] auth-field-label">{t("fields.name")}</span>
                  <input className="input h-11 py-2 auth-field-input" value={name} onChange={(event) => setName(event.target.value)} required />
                </label>
              ) : null}
              <label className="block auth-field">
                <span className="mb-1 block text-sm font-bold text-[#667085] auth-field-label">{t("fields.email")}</span>
                <input type="email" className="input h-11 py-2 auth-field-input" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </label>
              <label className="block auth-field">
                <span className="mb-1 block text-sm font-bold text-[#667085] auth-field-label">{t("fields.password")}</span>
                <input type="password" minLength={8} className="input h-11 py-2 auth-field-input" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </label>
              {displayedMessage ? <p className="rounded-lg bg-[#fff4f1] px-3 py-2 text-sm font-semibold text-[#c2412d]">{displayedMessage}</p> : null}
              <button disabled={pending} className="btn-primary h-11 w-full py-2 disabled:opacity-60 auth-submit-btn">
                {pending ? t("actions.pleaseWait") : mode === "login" ? t("actions.signIn") : t("actions.createAccount")}
              </button>
            </form>
          </>
        ) : null}

        {emailOnlyEnabled ? (
          <>
            {socialProviders.length ? <div className="my-5 h-px bg-[#d9e7ff]" /> : null}
            <label className="block auth-field">
              <span className="mb-1 block text-sm font-bold text-[#667085] auth-field-label">{t("fields.email")}</span>
              <input type="email" className="input h-11 py-2 auth-field-input" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
          </>
        ) : null}

        {emailMagicEnabled ? (
          <button type="button" className="btn-secondary mt-3 h-11 w-full py-2 auth-secondary-btn" onClick={sendMagicLink} disabled={pending || !email}>
            <Mail size={16} />
            {t("actions.sendMagicLink")}
          </button>
        ) : null}

        <p className="mt-5 text-center text-sm text-[#667085] auth-switch-copy">
          {mode === "login" ? t("switch.noAccount") : t("switch.hasAccount")}
          <Link className="ml-1 font-bold text-[#e60012]" href={mode === "login" ? registerHref : loginHref}>
            {mode === "login" ? t("switch.createOne") : t("switch.signIn")}
          </Link>
        </p>
      </section>
    </div>
  );
}

function providerIcon(provider: string) {
  if (provider === "github") return <Github size={17} />;
  if (provider === "email") return <Mail size={17} />;
  return <span className="grid size-5 place-items-center rounded-full bg-slate-100 text-xs font-black uppercase">{provider.charAt(0)}</span>;
}
