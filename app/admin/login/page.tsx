"use client";

import { useState, useEffect } from "react";
import { signIn, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const S = {
  card: { background: "rgba(255,252,254,0.96)", borderRadius: 28, padding: "32px 28px", boxShadow: "0 8px 40px rgba(255,107,157,0.2)", border: "1px solid rgba(255,255,255,0.6)" },
  logo: { fontSize: 32, fontWeight: 900, background: "linear-gradient(135deg, #FF6B9D, #C084FC)", WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" as const, letterSpacing: "-0.5px" },
  input: { width: "100%", padding: "12px 16px", borderRadius: 14, border: "2px solid #F3EEF4", fontSize: 14, outline: "none", background: "#FFFCFE", fontFamily: "inherit", boxSizing: "border-box" as const },
  btnPrimary: { width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #FF6B9D, #C084FC)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(255,107,157,0.4)" },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#8B7A8E", marginBottom: 6 },
};

function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const registered = params.get("registered") === "1";

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

    // セッションからロールを取得してアクセス制御
    const res = await fetch("/api/auth/session");
    const session = await res.json();
    const role = session?.user?.role;

    if (role === "ADMIN") {
      router.push("/admin/dashboard");
    } else {
      // ADMIN以外はログアウトしてエラーを表示
      await signOut({ redirect: false });
      setError("管理者アカウントのみアクセスできます");
    }
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

          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1E0A1E", marginBottom: 20 }}>管理者ログイン</h2>

          {registered && (
            <div style={{ background: "#F0FFF4", borderRadius: 12, padding: "10px 14px", marginBottom: 16, borderLeft: "3px solid #10B981" }}>
              <p style={{ margin: 0, fontSize: 13, color: "#065F46" }}>管理者アカウントを作成しました。ログインしてください。</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>メールアドレス</label>
              <input style={S.input} type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com"
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

          <p style={{ textAlign: "center", marginTop: 14 }}>
            <Link href="/admin/forgot-password" style={{ color: "#8B7A8E", fontSize: 12, textDecoration: "none" }}>
              パスワードをお忘れですか？
            </Link>
          </p>

          <div style={{ borderTop: "1px dashed #F3EEF4", marginTop: 20, paddingTop: 16 }}>
            <Link href="/login" style={{ fontSize: 12, color: "#8B7A8E", textDecoration: "none" }}>
              ← 招待者ログイン
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Suspense } from "react";
export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
