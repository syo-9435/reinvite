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

interface Props {
  token: string;
  isExpired: boolean;
}

export default function ResetPasswordClient({ token, isExpired }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // 期限切れ・使用済み画面
  if (isExpired) {
    return (
      <div style={S.card}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link href="/" style={{ textDecoration: "none" }}><h1 style={S.logo}>Re:invite</h1></Link>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>⏱</div>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: "#1E0A1E", marginBottom: 10 }}>
            リンクが無効です
          </h2>
          <p style={{ fontSize: 13, color: "#8B7A8E", lineHeight: 1.7, marginBottom: 24 }}>
            このリンクは有効期限切れか、既に使用済みです。<br />
            再度パスワードリセットをリクエストしてください。
          </p>
          <Link href="/forgot-password" style={{
            display: "inline-block",
            padding: "12px 28px",
            background: "linear-gradient(135deg, #FF6B9D, #C084FC)",
            borderRadius: 14,
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            textDecoration: "none",
            boxShadow: "0 4px 16px rgba(255,107,157,0.4)",
          }}>
            再度リセットを申請する
          </Link>
        </div>
      </div>
    );
  }

  // 完了画面
  if (done) {
    return (
      <div style={S.card}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link href="/" style={{ textDecoration: "none" }}><h1 style={S.logo}>Re:invite</h1></Link>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: "#1E0A1E", marginBottom: 10 }}>
            パスワードを更新しました
          </h2>
          <p style={{ fontSize: 13, color: "#8B7A8E", marginBottom: 28, lineHeight: 1.7 }}>
            新しいパスワードでログインしてください。
          </p>
          <Link href="/login" style={{
            display: "inline-block",
            padding: "12px 28px",
            background: "linear-gradient(135deg, #FF6B9D, #C084FC)",
            borderRadius: 14,
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            textDecoration: "none",
            boxShadow: "0 4px 16px rgba(255,107,157,0.4)",
          }}>
            ログインする →
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("パスワードが一致しません");
      return;
    }
    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "エラーが発生しました");
      return;
    }

    setDone(true);
  }

  return (
    <div style={S.card}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h1 style={S.logo}>Re:invite</h1>
        <p style={{ fontSize: 12, color: "#8B7A8E", marginTop: 4, letterSpacing: 2 }}>IDOL EVENT MANAGEMENT</p>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1E0A1E", marginBottom: 8 }}>
        新しいパスワードを設定
      </h2>
      <p style={{ fontSize: 13, color: "#8B7A8E", marginBottom: 24, lineHeight: 1.6 }}>
        8文字以上の新しいパスワードを入力してください。
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>新しいパスワード</label>
          <input
            style={S.input}
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            onFocus={e => e.target.style.borderColor = "#FF6B9D"}
            onBlur={e => e.target.style.borderColor = "#F3EEF4"}
          />
          {/* ストレングスメーター */}
          {password.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "#8B7A8E" }}>強度</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: strength(password).color }}>
                  {strength(password).label}
                </span>
              </div>
              <div style={{ height: 4, background: "#F3EEF4", borderRadius: 10, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${strength(password).pct}%`,
                  background: strength(password).barColor,
                  borderRadius: 10,
                  transition: "width 0.3s",
                }} />
              </div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={S.label}>パスワード（確認）</label>
          <input
            style={{
              ...S.input,
              borderColor: confirm.length > 0 && confirm !== password ? "#FCA5A5" : "#F3EEF4",
            }}
            type="password"
            required
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••"
            onFocus={e => e.target.style.borderColor = "#FF6B9D"}
            onBlur={e => e.target.style.borderColor = confirm !== password && confirm.length > 0 ? "#FCA5A5" : "#F3EEF4"}
          />
          {confirm.length > 0 && confirm !== password && (
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#ef4444" }}>パスワードが一致しません</p>
          )}
        </div>

        {error && (
          <div style={{ background: "#FFF0F6", borderRadius: 12, padding: "10px 14px", marginBottom: 16, borderLeft: "3px solid #FF6B9D" }}>
            <p style={{ margin: 0, fontSize: 13, color: "#1E0A1E" }}>{error}</p>
          </div>
        )}

        <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>
          {loading ? "更新中..." : "パスワードを更新する"}
        </button>
      </form>
    </div>
  );
}

function strength(pw: string): { label: string; pct: number; color: string; barColor: string } {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { label: "弱い",   pct: 25,  color: "#ef4444", barColor: "#FCA5A5" };
  if (score <= 2) return { label: "普通",   pct: 50,  color: "#d97706", barColor: "#FDE68A" };
  if (score <= 3) return { label: "良い",   pct: 75,  color: "#FF6B9D", barColor: "linear-gradient(90deg, #FF6B9D, #C084FC)" };
  return                { label: "強い",   pct: 100, color: "#16a34a", barColor: "linear-gradient(90deg, #6EE7B7, #34d399)" };
}
