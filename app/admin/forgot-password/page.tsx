"use client";

import { useState } from "react";
import Link from "next/link";

const S = {
  card: { background: "rgba(255,252,254,0.96)", borderRadius: 28, padding: "32px 28px", boxShadow: "0 8px 40px rgba(255,107,157,0.2)", border: "1px solid rgba(255,255,255,0.6)" },
  logo: { fontSize: 32, fontWeight: 900, background: "linear-gradient(135deg, #FF6B9D, #C084FC)", WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" as const, letterSpacing: "-0.5px" },
  input: { width: "100%", padding: "12px 16px", borderRadius: 14, border: "2px solid #F3EEF4", fontSize: 14, outline: "none", background: "#FFFCFE", fontFamily: "inherit", boxSizing: "border-box" as const },
  btn: { width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #FF6B9D, #C084FC)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(255,107,157,0.4)" },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#8B7A8E", marginBottom: 6 } as React.CSSProperties,
};

export default function AdminForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "エラーが発生しました");
      return;
    }

    setSent(true);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #FF6B9D 0%, #FF9EC4 50%, #C084FC 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, position: "relative", overflow: "hidden",
    }}>
      {[
        { w: 160, h: 160, top: -50, right: -50, c: "rgba(255,255,255,0.15)" },
        { w: 80,  h: 80,  bottom: 40, left: 20,  c: "rgba(233,213,255,0.25)" },
        { w: 40,  h: 40,  top: "30%", left: "10%", c: "rgba(255,255,255,0.2)" },
      ].map((s, i) => (
        <div key={i} style={{ position: "absolute", borderRadius: "50%", width: s.w, height: s.h, top: s.top, bottom: s.bottom as number | undefined, left: s.left, right: s.right as number | undefined, background: s.c }} />
      ))}

      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
        <div style={S.card}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <Link href="/" style={{ textDecoration: "none" }}><h1 style={S.logo}>Re:invite</h1></Link>
            <p style={{ fontSize: 12, color: "#8B7A8E", marginTop: 4, letterSpacing: 2 }}>IDOL EVENT MANAGEMENT</p>
          </div>

          {sent ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📨</div>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: "#1E0A1E", marginBottom: 10 }}>
                メールを送信しました
              </h2>
              <p style={{ fontSize: 13, color: "#8B7A8E", lineHeight: 1.7, marginBottom: 24 }}>
                <strong style={{ color: "#1E0A1E" }}>{email}</strong> にパスワード再設定用のURLを送信しました。
                メールが届かない場合はスパムフォルダをご確認ください。
              </p>
              <div style={{ background: "#FFF0F6", borderRadius: 14, padding: "14px 16px", borderLeft: "3px solid #FF6B9D", textAlign: "left", marginBottom: 24 }}>
                <p style={{ margin: 0, fontSize: 12, color: "#8B7A8E", lineHeight: 1.6 }}>
                  ⏱ リンクの有効期限は <strong style={{ color: "#1E0A1E" }}>1時間</strong> です
                </p>
              </div>
              <Link href="/admin/login" style={{ color: "#FF6B9D", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                ← 管理者ログインに戻る
              </Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1E0A1E", marginBottom: 8 }}>
                管理者パスワードリセット
              </h2>
              <p style={{ fontSize: 13, color: "#8B7A8E", marginBottom: 24, lineHeight: 1.6 }}>
                登録済みのメールアドレスを入力してください。パスワード再設定用のURLをお送りします。
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 20 }}>
                  <label style={S.label}>メールアドレス</label>
                  <input
                    style={S.input}
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    onFocus={e => e.target.style.borderColor = "#FF6B9D"}
                    onBlur={e => e.target.style.borderColor = "#F3EEF4"}
                  />
                </div>

                {error && (
                  <div style={{ background: "#FFF0F6", borderRadius: 12, padding: "10px 14px", marginBottom: 16, borderLeft: "3px solid #FF6B9D" }}>
                    <p style={{ margin: 0, fontSize: 13, color: "#1E0A1E" }}>{error}</p>
                  </div>
                )}

                <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>
                  {loading ? "送信中..." : "再設定URLを送る"}
                </button>
              </form>

              <p style={{ textAlign: "center", fontSize: 13, color: "#8B7A8E", marginTop: 20 }}>
                <Link href="/admin/login" style={{ color: "#FF6B9D", fontWeight: 700, textDecoration: "none" }}>
                  ← 管理者ログインに戻る
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
