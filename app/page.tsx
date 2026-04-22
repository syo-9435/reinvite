import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import EventCard from "@/components/events/EventCard";
import AuthButton from "@/components/layout/AuthButton";

export default async function HomePage() {
  const session = await auth();
  const role = session?.user.role;

  const now = new Date();
  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      startAt: { lte: now },
      OR: [{ endAt: null }, { endAt: { gte: now } }],
    },
    orderBy: { startAt: "asc" },
    select: {
      id: true, title: true, startAt: true, venue: true, imageUrl: true,
      _count: { select: { invitations: true } },
    },
  });

  return (
    <div style={{ background: "#0A060E", minHeight: "100vh", color: "#fff" }}>

      {/* ── ヘッダー ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(10,6,14,0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          padding: "0 20px",
          height: 58,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* ロゴ */}
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{
              fontSize: 22, fontWeight: 900,
              background: "linear-gradient(135deg, #FF6B9D, #C084FC)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              letterSpacing: "-0.5px",
            }}>Re:invite</span>
          </Link>

          {/* ナビゲーション */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* 未ログイン: 両方表示 */}
            {!session && (
              <>
                <Link href="/admin/login" style={{
                  padding: "7px 16px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 20, fontSize: 13, fontWeight: 600,
                  color: "rgba(255,255,255,0.7)", textDecoration: "none",
                }}>運営者向け</Link>
                <Link href="/login" style={{
                  padding: "7px 16px",
                  background: "rgba(255,107,157,0.15)",
                  border: "1px solid rgba(255,107,157,0.4)",
                  borderRadius: 20, fontSize: 13, fontWeight: 700,
                  color: "#FF6B9D", textDecoration: "none",
                }}>招待者向け</Link>
              </>
            )}
            {/* ADMIN: 管理者ダッシュボードのみ */}
            {role === "ADMIN" && (
              <Link href="/admin/dashboard" style={{
                padding: "7px 16px",
                background: "rgba(192,132,252,0.15)",
                border: "1px solid rgba(192,132,252,0.4)",
                borderRadius: 20, fontSize: 13, fontWeight: 700,
                color: "#C084FC", textDecoration: "none",
              }}>マイページ</Link>
            )}
            {/* INVITER: 招待者ダッシュボードのみ */}
            {role === "INVITER" && (
              <Link href="/dashboard" style={{
                padding: "7px 16px",
                background: "rgba(255,107,157,0.15)",
                border: "1px solid rgba(255,107,157,0.4)",
                borderRadius: 20, fontSize: 13, fontWeight: 700,
                color: "#FF6B9D", textDecoration: "none",
              }}>マイページ</Link>
            )}
            {/* ログイン済み: ログアウトボタン表示 */}
            {session && <AuthButton loggedIn={true} />}
          </div>
        </div>
      </header>

      {/* ── ヒーロー ── */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        {/* 背景グロー */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(192,132,252,0.22) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: -80, left: "10%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,107,157,0.12) 0%, transparent 70%)",
          filter: "blur(40px)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: -40, right: "5%",
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(129,140,248,0.12) 0%, transparent 70%)",
          filter: "blur(40px)", pointerEvents: "none",
        }} />

        <div style={{
          position: "relative", zIndex: 1,
          maxWidth: 1200, margin: "0 auto",
          padding: "72px 20px 64px",
          textAlign: "center",
        }}>
          {/* タグライン */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(255,107,157,0.1)",
            border: "1px solid rgba(255,107,157,0.25)",
            borderRadius: 20, padding: "4px 14px",
            fontSize: 11, fontWeight: 700, color: "#FF6B9D",
            letterSpacing: "0.1em", marginBottom: 24,
          }}>
            🎀 IDOL EVENT MANAGEMENT
          </div>

          <h1 style={{
            fontSize: "clamp(36px, 8vw, 68px)",
            fontWeight: 900, lineHeight: 1.1,
            margin: "0 0 20px", letterSpacing: "-1px",
          }}>
            <span style={{
              background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.75) 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>あなたに届く、</span>
            <br />
            <span style={{
              background: "linear-gradient(135deg, #FF6B9D 0%, #C084FC 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>特別な招待状。</span>
          </h1>

          <p style={{
            fontSize: 15, color: "rgba(255,255,255,0.5)",
            margin: "0 auto 40px", maxWidth: 440, lineHeight: 1.7,
          }}>
            アイドルイベントに参加しよう。<br />
            特別なメンバーだけが受け取れる招待状で、忘れられない体験を。
          </p>

        </div>
      </section>

      {/* ── イベント一覧 ── */}
      {events.length > 0 && (
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px 80px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 16,
          }}>
            {events.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* ── フッター ── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "24px 20px", textAlign: "center",
      }}>
        <div style={{
          fontSize: 16, fontWeight: 900,
          background: "linear-gradient(135deg, #FF6B9D, #C084FC)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginBottom: 6,
        }}>Re:invite</div>
        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
          © 2025 Re:invite. Idol Event Management System.
        </p>
      </footer>
    </div>
  );
}
