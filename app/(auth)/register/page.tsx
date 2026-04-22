"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const S = {
  card: { background: "rgba(255,252,254,0.96)", borderRadius: 28, padding: "32px 28px", boxShadow: "0 8px 40px rgba(255,107,157,0.2)", border: "1px solid rgba(255,255,255,0.6)" },
  logo: { fontSize: 32, fontWeight: 900, background: "linear-gradient(135deg, #FF6B9D, #C084FC)", WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" as const, letterSpacing: "-0.5px" },
  input: { width: "100%", padding: "12px 16px", borderRadius: 14, border: "2px solid #F3EEF4", fontSize: 14, outline: "none", background: "#FFFCFE", fontFamily: "inherit", boxSizing: "border-box" as const },
  btnPrimary: { width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #FF6B9D, #C084FC)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(255,107,157,0.4)" },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#8B7A8E", marginBottom: 8 } as React.CSSProperties,
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#8B7A8E", letterSpacing: "0.1em", marginBottom: 8 } as React.CSSProperties,
};

const GENDERS = [
  { value: "MALE",      label: "男性" },
  { value: "FEMALE",    label: "女性" },
  { value: "OTHER",     label: "その他" },
  { value: "NO_ANSWER", label: "回答しない" },
];

const AGE_GROUPS = [
  { value: "TEENS",        label: "10代" },
  { value: "TWENTIES",     label: "20代" },
  { value: "THIRTIES",     label: "30代" },
  { value: "FORTIES",      label: "40代" },
  { value: "FIFTIES_PLUS", label: "50代以上" },
];

const TERMS_SECTIONS = [
  {
    title: "第1条（目的）",
    body: "本利用規約（以下「本規約」）は、Re:invite（以下「本サービス」）の利用条件を定めるものです。登録ユーザーの皆さま（以下「ユーザー」）には、本規約に従って本サービスをご利用いただきます。",
  },
  {
    title: "第2条（利用登録）",
    body: "登録希望者が所定の方法によって利用登録を申請し、運営が承認することで利用登録が完了します。運営は以下の場合に利用登録を拒否することがあります。\n・虚偽の情報を申請した場合\n・過去に本規約に違反したことがある場合\n・その他、運営が不適切と判断した場合",
  },
  {
    title: "第3条（アカウント管理）",
    body: "ユーザーは自己の責任においてアカウント情報を管理するものとします。ユーザーは、いかなる場合にもアカウントを第三者に譲渡または貸与することはできません。アカウントが第三者に使用されたことによる損害は、運営に故意または重大な過失がある場合を除き、運営は責任を負いません。",
  },
  {
    title: "第4条（招待状の取り扱い）",
    body: "本サービスを通じて発行される招待状は、特定の個人に対して発行されるものです。招待状の内容（招待URL・QRコード等）を第三者と共有したり、SNS等に公開することを禁止します。不正な方法でイベントに参加しようとする行為は、アカウントの停止・削除の対象となります。",
  },
  {
    title: "第5条（禁止事項）",
    body: "ユーザーは、本サービスの利用にあたり以下の行為を行ってはなりません。\n・法令または公序良俗に違反する行為\n・犯罪行為に関連する行為\n・運営、他のユーザー、またはその他第三者の知的財産権・プライバシー・名誉を侵害する行為\n・本サービスのサーバーやネットワークに過度な負荷をかける行為\n・本サービスの運営を妨害する行為\n・不正アクセスをし、またはこれを試みる行為\n・他のユーザーに関する個人情報を収集する行為\n・その他、運営が不適切と判断する行為",
  },
  {
    title: "第6条（個人情報の取り扱い）",
    body: "運営は、ユーザーの個人情報（氏名・メールアドレス・電話番号・性別・年代等）をイベント招待・運営管理の目的にのみ使用します。収集した個人情報は、法令に基づく場合を除き、第三者に提供しません。",
  },
  {
    title: "第7条（サービスの変更・停止）",
    body: "運営は、ユーザーへの事前通知なしに本サービスの内容を変更し、または本サービスの提供を停止もしくは終了することができます。これによりユーザーに生じた損害について、運営は責任を負いません。",
  },
  {
    title: "第8条（免責事項）",
    body: "運営の過失によらないユーザーに生じた損害については、運営は責任を負いません。本サービスはイベント情報の提供・招待状管理を目的とするものであり、イベント自体の内容・実施については各主催者が責任を負います。",
  },
  {
    title: "第9条（規約の変更）",
    body: "運営は、必要と判断した場合には、ユーザーへの通知なしに本規約を変更することがあります。変更後の利用規約は本サービス上に掲示された時点から効力を生じます。",
  },
  {
    title: "第10条（準拠法・管轄裁判所）",
    body: "本規約の解釈にあたっては日本法を準拠法とします。本サービスに関して紛争が生じた場合には、運営の所在地を管轄する裁判所を専属的合意管轄とします。",
  },
];

function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
      {options.map(opt => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(selected ? "" : opt.value)}
            style={{
              padding: "8px 16px",
              borderRadius: 20,
              border: `2px solid ${selected ? "#FF6B9D" : "#F3EEF4"}`,
              background: selected ? "#FFF0F6" : "#FFFCFE",
              color: selected ? "#FF6B9D" : "#8B7A8E",
              fontSize: 13,
              fontWeight: selected ? 700 : 500,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function TermsModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(30,10,30,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff",
        borderRadius: 24,
        width: "100%",
        maxWidth: 560,
        maxHeight: "85vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 24px 80px rgba(255,107,157,0.25)",
        overflow: "hidden",
      }}>
        {/* モーダルヘッダー */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid #F3EEF4",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1E0A1E" }}>利用規約</h2>
            <p style={{ margin: "3px 0 0", fontSize: 11, color: "#8B7A8E" }}>Re:invite サービス利用規約</p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              border: "none", background: "#F3EEF4",
              cursor: "pointer", fontSize: 16, color: "#8B7A8E",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "inherit",
            }}
            aria-label="閉じる"
          >×</button>
        </div>

        {/* 本文 */}
        <div style={{ overflowY: "auto", padding: "20px 24px 28px", flex: 1 }}>
          <p style={{ margin: "0 0 20px", fontSize: 12, color: "#8B7A8E", lineHeight: 1.6 }}>
            最終更新日：2025年1月1日
          </p>
          <p style={{ margin: "0 0 24px", fontSize: 13, color: "#4A3A4A", lineHeight: 1.8 }}>
            本サービスをご利用いただく前に、以下の利用規約をよくお読みください。
            サービスのご利用をもって、本規約に同意したものとみなします。
          </p>

          {TERMS_SECTIONS.map(section => (
            <div key={section.title} style={{ marginBottom: 20 }}>
              <h3 style={{
                margin: "0 0 8px",
                fontSize: 13, fontWeight: 700, color: "#1E0A1E",
              }}>{section.title}</h3>
              <p style={{
                margin: 0,
                fontSize: 13, color: "#4A3A4A",
                lineHeight: 1.8, whiteSpace: "pre-wrap",
              }}>{section.body}</p>
            </div>
          ))}

          <div style={{
            marginTop: 28, padding: "14px 16px",
            background: "#FFF8FC", borderRadius: 12,
            border: "1px solid #FFD6E8",
          }}>
            <p style={{ margin: 0, fontSize: 12, color: "#8B7A8E", textAlign: "center" }}>
              以上。Re:invite 運営チーム
            </p>
          </div>
        </div>

        {/* フッターボタン */}
        <div style={{
          padding: "14px 24px",
          borderTop: "1px solid #F3EEF4",
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              width: "100%", padding: "12px",
              borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #FF6B9D, #C084FC)",
              color: "#fff", fontWeight: 700, fontSize: 14,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    gender: "",
    ageGroup: "",
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(key: keyof typeof form) {
    return (v: string) => setForm(prev => ({ ...prev, [key]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("パスワードが一致しません");
      return;
    }
    if (!agreedToTerms) {
      setError("利用規約に同意してください");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        password: form.password,
        gender: form.gender || null,
        ageGroup: form.ageGroup || null,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "登録に失敗しました");
      return;
    }

    router.push("/login?registered=1");
  }

  const focusBorder = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = "#FF6B9D");
  const blurBorder  = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = "#F3EEF4");

  return (
    <>
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}

      <div style={S.card}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Link href="/" style={{ textDecoration: "none" }}><h1 style={S.logo}>Re:invite</h1></Link>
          <p style={{ fontSize: 12, color: "#8B7A8E", marginTop: 4, letterSpacing: 2 }}>IDOL EVENT MANAGEMENT</p>
        </div>

        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1E0A1E", marginBottom: 4 }}>招待者登録</h2>
      <p style={{ fontSize: 12, color: "#8B7A8E", marginBottom: 20 }}>招待者（INVITER）アカウントを作成します</p>

        <form onSubmit={handleSubmit}>
          {/* 基本情報 */}
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>お名前（任意）</label>
            <input style={S.input} type="text" value={form.name}
              onChange={e => set("name")(e.target.value)} placeholder="山田 花子"
              onFocus={focusBorder} onBlur={blurBorder} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>メールアドレス <span style={{ color: "#FF6B9D" }}>*</span></label>
            <input style={S.input} type="email" required value={form.email}
              onChange={e => set("email")(e.target.value)} placeholder="you@example.com"
              onFocus={focusBorder} onBlur={blurBorder} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>電話番号 <span style={{ color: "#FF6B9D" }}>*</span></label>
            <input style={S.input} type="tel" required value={form.phone}
              onChange={e => set("phone")(e.target.value)} placeholder="09012345678"
              pattern="^[0-9\-+() ]{7,15}$"
              title="有効な電話番号を入力してください"
              onFocus={focusBorder} onBlur={blurBorder} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>パスワード（8文字以上）<span style={{ color: "#FF6B9D" }}>*</span></label>
            <input style={S.input} type="password" required value={form.password}
              onChange={e => set("password")(e.target.value)} placeholder="••••••••"
              onFocus={focusBorder} onBlur={blurBorder} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>パスワード（確認）<span style={{ color: "#FF6B9D" }}>*</span></label>
            <input style={S.input} type="password" required value={form.confirm}
              onChange={e => set("confirm")(e.target.value)} placeholder="••••••••"
              onFocus={focusBorder} onBlur={blurBorder} />
          </div>

          {/* 区切り線 */}
          <div style={{ borderTop: "1px dashed #F3EEF4", marginBottom: 20 }} />

          {/* 性別 */}
          <div style={{ marginBottom: 20 }}>
            <label style={S.sectionTitle}>性別（任意）</label>
            <ChipGroup options={GENDERS} value={form.gender} onChange={set("gender")} />
          </div>

          {/* 年代 */}
          <div style={{ marginBottom: 24 }}>
            <label style={S.sectionTitle}>年代（任意）</label>
            <ChipGroup options={AGE_GROUPS} value={form.ageGroup} onChange={set("ageGroup")} />
          </div>

          {/* 区切り線 */}
          <div style={{ borderTop: "1px dashed #F3EEF4", marginBottom: 20 }} />

          {/* 利用規約同意 */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              cursor: "pointer", userSelect: "none",
            }}>
              <div style={{ position: "relative", flexShrink: 0, marginTop: 1 }}>
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                />
                <div style={{
                  width: 20, height: 20, borderRadius: 6,
                  border: `2px solid ${agreedToTerms ? "#FF6B9D" : "#D4C8D6"}`,
                  background: agreedToTerms ? "linear-gradient(135deg, #FF6B9D, #C084FC)" : "#FFFCFE",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}>
                  {agreedToTerms && (
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4L4 7.5L10 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span style={{ fontSize: 13, color: "#4A3A4A", lineHeight: 1.5 }}>
                <button
                  type="button"
                  onClick={e => { e.preventDefault(); setShowTerms(true); }}
                  style={{
                    background: "none", border: "none", padding: 0,
                    color: "#FF6B9D", fontWeight: 700, fontSize: 13,
                    cursor: "pointer", fontFamily: "inherit",
                    textDecoration: "underline", textUnderlineOffset: 2,
                  }}
                >利用規約</button>
                に同意する <span style={{ color: "#FF6B9D" }}>*</span>
              </span>
            </label>
          </div>

          {error && (
            <div style={{ background: "#FFF0F6", borderRadius: 12, padding: "10px 14px", marginBottom: 16, borderLeft: "3px solid #FF6B9D" }}>
              <p style={{ margin: 0, fontSize: 13, color: "#1E0A1E" }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !agreedToTerms}
            style={{
              ...S.btnPrimary,
              opacity: loading || !agreedToTerms ? 0.5 : 1,
              cursor: loading || !agreedToTerms ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "登録中..." : "アカウントを作成"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 13, color: "#8B7A8E", marginTop: 18 }}>
          既に招待者アカウントをお持ちの方は{" "}
          <Link href="/login" style={{ color: "#FF6B9D", fontWeight: 700, textDecoration: "none" }}>ログイン</Link>
        </p>
      </div>
    </>
  );
}
