"use client";

import { FormEvent, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { buildBuyUrl, isSourceUrl } from "@/lib/source-url";
import { getSeoLocaleByAppLocale } from "../../../config/i18n";

const historyKey = "haitao_search_history";
const frontendLocaleCookie = "NEXT_LOCALE";
const marketplaceBadgesImage =
  "data:image/webp;base64,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";

export function CnsnapSearchBox({
  compact = false,
  hero = false,
  submitIconOnly = false,
  heroPlaceholderVisible = false
}: {
  compact?: boolean;
  hero?: boolean;
  submitIconOnly?: boolean;
  heroPlaceholderVisible?: boolean;
}) {
  const locale = useLocale();
  const buyLocale = getSeoLocaleByAppLocale(locale) ?? locale;
  const searchPath = `/${buyLocale}/search`;
  const t = useTranslations("common.header.search");
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [floatingStyle, setFloatingStyle] = useState<React.CSSProperties>({});
  const historySnapshot = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener("haitao-search-history-updated", onStoreChange);
      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener("haitao-search-history-updated", onStoreChange);
      };
    },
    () => localStorage.getItem(historyKey) ?? "[]",
    () => "[]"
  );
  const history = JSON.parse(historySnapshot) as string[];

  const placeholder = t("placeholder");
  const activeHistory = focused && history.length > 0;

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setFocused(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!focused || !rootRef.current) {
      setFloatingStyle({});
      return;
    }

    function updatePosition() {
      if (window.innerWidth > 640) {
        setFloatingStyle({});
        return;
      }

      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      setFloatingStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left: hero && window.innerWidth <= 640 ? 12 : rect.left,
        right: hero && window.innerWidth <= 640 ? 12 : "auto",
        width: hero && window.innerWidth <= 640 ? "auto" : rect.width,
        zIndex: 260
      });
    }

    const frameId = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [focused, hero]);

  function persistHistory(nextValue: string) {
    const trimmed = nextValue.trim();
    if (!trimmed) return;
    const nextHistory = [trimmed, ...history.filter((item) => item !== trimmed)].slice(0, 8);
    localStorage.setItem(historyKey, JSON.stringify(nextHistory));
    window.dispatchEvent(new CustomEvent("haitao-search-history-updated"));
  }

  function removeHistory(item: string) {
    const nextHistory = history.filter((entry) => entry !== item);
    localStorage.setItem(historyKey, JSON.stringify(nextHistory));
    window.dispatchEvent(new CustomEvent("haitao-search-history-updated"));
  }

  function clearHistory() {
    localStorage.removeItem(historyKey);
    window.dispatchEvent(new CustomEvent("haitao-search-history-updated"));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    persistHistory(trimmed);
    document.cookie = `${frontendLocaleCookie}=${encodeURIComponent(locale)}; Path=/; Max-Age=31536000; SameSite=Lax`;

    if (isSourceUrl(trimmed)) {
      window.location.href = buildBuyUrl(trimmed, buyLocale);
      return;
    }

    const params = new URLSearchParams({
      type: "keyword",
      platform: "taobao",
      q: trimmed
    });
    window.location.href = `${searchPath}?${params.toString()}`;
  }

  return (
    <div ref={rootRef} className="relative" data-hero-search={hero ? "true" : undefined}>
      <form
        onSubmit={onSubmit}
        autoComplete="off"
        className={`search-box cnsnap-search-box common-main-search common-search-theme-main image-search type-selector no-login brand-surface flex items-center rounded-[18px] p-2 transition focus-within:border-[#f7b8c3] focus-within:shadow-[0_14px_32px_rgba(217,20,47,0.10)] ${compact ? "is-compact min-h-[56px]" : "is-hero min-h-[72px]"}`}
      >
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onFocus={() => setFocused(true)}
          name="q"
          required
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-lpignore="true"
          data-form-type="other"
          className="search-input cnsnap-search-input h-[50px] min-w-0 flex-1 border-0 bg-transparent px-4 text-[16px] font-semibold text-[#101828] outline-none placeholder:font-medium placeholder:text-[#98a2b3]"
          placeholder={heroPlaceholderVisible ? "" : placeholder}
          type="text"
        />
        {heroPlaceholderVisible && !value ? (
          <span className="cnsnap-search-hero-placeholder pointer-events-none absolute left-4 right-[96px] top-1/2 -translate-y-1/2 truncate text-[16px] font-semibold text-[#98a2b3]">
            {placeholder}
          </span>
        ) : null}
        <div className={`placeholder-img cnsnap-search-badges mr-3 h-[34px] w-32 shrink-0 ${compact ? "hidden lg:block" : "hidden sm:block"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={marketplaceBadgesImage} alt="" loading="eager" fetchPriority="high" className="image h-full w-full object-contain" />
        </div>
        <button className="text-btn cnsnap-search-submit h-[50px] rounded-xl bg-[#d9142f] px-8 text-[16px] font-extrabold text-white shadow-[0_12px_24px_rgba(217,20,47,0.20)] transition hover:bg-[#b90f25]" aria-label={t("submit")}>
          {submitIconOnly ? <Search size={16} aria-hidden="true" /> : t("submit")}
        </button>
      </form>

      <section
        style={floatingStyle}
        className={`common-main-search-history ${activeHistory ? "active" : ""} brand-surface ${floatingStyle.position === "fixed" ? "" : "absolute left-0 right-0 top-[calc(100%+8px)]"} rounded-[16px] p-4 text-left text-[#667085] ${activeHistory ? "block" : "hidden"}`}
      >
        <h3 className="flex items-center justify-between text-sm font-bold">
          <span>{t("historyTitle")}</span>
          <button type="button" className="text-xs font-semibold text-[#98a2b3] hover:text-[#d9142f]" onMouseDown={(event) => event.preventDefault()} onClick={clearHistory}>
            {t("clearAll")}
          </button>
        </h3>
        <section className="search-history-list mt-3">
          <ul className="flex flex-wrap gap-2">
            {history.map((item) => (
              <li key={item}>
                <span title={item} className="ant-tag inline-flex max-w-[360px] items-center gap-2 rounded-full border border-[#dfe7f1] bg-[#f8fafc] px-3 py-1 text-sm font-semibold text-[#344054]">
                  <button
                    type="button"
                    className="ant-typography ant-typography-ellipsis ant-typography-ellipsis-single-line max-w-[290px] truncate"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setValue(item)}
                  >
                    {item}
                  </button>
                  <button type="button" aria-label="icon: close" className="anticon anticon-close text-[#98a2b3] hover:text-[#d9142f]" onMouseDown={(event) => event.preventDefault()} onClick={() => removeHistory(item)}>
                    <X size={13} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </section>
    </div>
  );
}
