"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const S = {
  card: { background: "rgba(255,252,254,0.96)", borderRadius: 28, padding: "32px 28px", boxShadow: "0 8px 40px rgba(255,107,157,0.2)", border: "1px solid rgba(255,255,255,0.6)" },
  logo: { fontSize: 32, fontWeight: 900, background: "linear-gradient(135deg, #FF6B9D, #C084FC)", WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" as const, letterSpacing: "-0.5px" },
  input: { width: "100%", padding: "12px 16px", borderRadius: 14, border: "2px solid #F3EEF4", fontSize: 14, outline: "none", background: "#FFFCFE", fontFamily: "inherit", boxSizing: "border-box" as const },
  btnPrimary: { width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #FF6B9D, #C084FC)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(255,107,157,0.4)" },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#8B7A8E", marginBottom: 6 },
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      if (result.code === "ACCOUNT_SUSPENDED") {
        setError("このアカウントは停止されています。管理者にお問い合わせください。");
      } else {
        setError("メールアドレスまたはパスワードが正しくありません");
      }
      return;
    }

    const res = await fetch("/api/auth/session");
    const session = await res.json();
    if (session?.user?.role === "ADMIN") {
      await signOut({ redirect: false });
      setError("管理者の方は管理者用ページからログインしてください");
      return;
    }

    router.push("/auth/redirect");
  }

  return (
    <div style={S.card}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <Link href="/" style={{ textDecoration: "none" }}><h1 style={S.logo}>Re:invite</h1></Link>
        <p style={{ fontSize: 12, color: "#8B7A8E", marginTop: 4, letterSpacing: 2 }}>IDOL EVENT MANAGEMENT</p>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1E0A1E", marginBottom: 4 }}>招待者ログイン</h2>
      <p style={{ fontSize: 12, color: "#8B7A8E", marginBottom: 20 }}>招待者（INVITER）アカウントでログインしてください</p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>メールアドレス</label>
          <input style={S.input} type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
            onFocus={e => e.target.style.borderColor = "#FF6B9D"} onBlur={e => e.target.style.borderColor = "#F3EEF4"} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={S.label}>パスワード</label>
          <input style={S.input} type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
            onFocus={e => e.target.style.borderColor = "#FF6B9D"} onBlur={e => e.target.style.borderColor = "#F3EEF4"} />
        </div>

        {error && (
          <div style={{ background: "#FFF0F6", borderRadius: 12, padding: "10px 14px", marginBottom: 16, borderLeft: "3px solid #FF6B9D" }}>
            <p style={{ margin: 0, fontSize: 13, color: "#1E0A1E" }}>{error}</p>
          </div>
        )}

        <button type="submit" disabled={loading} style={{ ...S.btnPrimary, opacity: loading ? 0.7 : 1 }}>
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </form>

      {/* 区切り */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
        <div style={{ flex: 1, height: 1, background: "#F3EEF4" }} />
        <span style={{ fontSize: 11, color: "#8B7A8E", whiteSpace: "nowrap" }}>または</span>
        <div style={{ flex: 1, height: 1, background: "#F3EEF4" }} />
      </div>

      {/* LINE ログインボタン */}
      <button
        type="button"
        onClick={() => signIn("line", { callbackUrl: "/auth/redirect" })}
        style={{
          width: "100%", padding: "13px", borderRadius: 14, border: "none",
          background: "#00C300", color: "#fff", fontWeight: 700, fontSize: 14,
          cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
        LINEでログイン
      </button>

      <p style={{ textAlign: "center", marginTop: 16 }}>
        <Link href="/forgot-password" style={{ color: "#8B7A8E", fontSize: 12, textDecoration: "none" }}>
          パスワードをお忘れですか？
        </Link>
      </p>

      <p style={{ textAlign: "center", fontSize: 13, color: "#8B7A8E", marginTop: 10 }}>
        招待者アカウントをお持ちでない方は{" "}
        <Link href="/register" style={{ color: "#FF6B9D", fontWeight: 700, textDecoration: "none" }}>新規登録</Link>
      </p>

      <div style={{ borderTop: "1px dashed #F3EEF4", marginTop: 20, paddingTop: 16, textAlign: "center" }}>
        <Link href="/admin/login" style={{ fontSize: 12, color: "#8B7A8E", textDecoration: "none" }}>
          管理者の方はこちら →
        </Link>
      </div>
    </div>
  );
}
