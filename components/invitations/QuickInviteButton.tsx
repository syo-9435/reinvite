"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Event = { id: string; title: string; startAt: string | Date };
type SentInvitation = { id: string; email: string; token: string };

type Step = "event" | "email";

export default function QuickInviteButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("event");

  // イベント選択
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // メールアドレス入力
  const [emails, setEmails] = useState<string[]>([""]);

  // 送信済み一覧
  const [sent, setSent] = useState<SentInvitation[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function openDialog() {
    setStep("event");
    setSelectedEvent(null);
    setEmails([""]);
    setError("");
    setSent([]);
    setOpen(true);
    setEventsLoading(true);
    const res = await fetch("/api/user/owned-events");
    const data: Event[] = await res.json();
    setEvents(data);
    setEventsLoading(false);
  }

  function selectEvent(ev: Event) {
    setSelectedEvent(ev);
    setStep("email");
    setError("");
  }

  function updateEmail(index: number, value: string) {
    setEmails(prev => prev.map((e, i) => (i === index ? value : e)));
  }

  function addEmailField() {
    setEmails(prev => [...prev, ""]);
  }

  function removeEmailField(index: number) {
    setEmails(prev => prev.filter((_, i) => i !== index));
  }

  const validEmails = emails.filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()));

  async function handleSubmit() {
    if (!selectedEvent || validEmails.length === 0) return;
    setError("");
    setSubmitting(true);
    const res = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: selectedEvent.id,
        emails: validEmails,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(data.error ?? "エラーが発生しました"); return; }
    setSent(data as SentInvitation[]);
    router.refresh();
  }

  const dateStr = (d: string | Date) =>
    new Date(d).toLocaleDateString("ja-JP", { month: "short", day: "numeric", weekday: "short" });

  // 送信完了画面
  if (open && sent.length > 0) {
    return (
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(30,10,30,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px",
        }}
        onClick={e => { if (e.target === e.currentTarget) { setOpen(false); setSent([]); } }}
      >
        <div style={{
          background: "#fff", borderRadius: 24,
          width: "100%", maxWidth: 480,
          maxHeight: "85vh", display: "flex", flexDirection: "column",
          boxShadow: "0 24px 80px rgba(255,107,157,0.25)",
          padding: "32px 24px 28px",
        }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📨</div>
            <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 900, color: "#1E0A1E" }}>
              招待メールを送信しました
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: "#8B7A8E" }}>
              {sent.length}名に招待メールを送りました
            </p>
          </div>
          <div style={{ flex: 1, overflowY: "auto", marginBottom: 16 }}>
            {sent.map(inv => (
              <div key={inv.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 12,
                background: "#FFF0F6", border: "1px solid #FFD6E8",
                marginBottom: 6,
              }}>
                <span style={{ fontSize: 16 }}>✉️</span>
                <span style={{ fontSize: 13, color: "#1E0A1E", fontWeight: 600 }}>{inv.email}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => { setOpen(false); setSent([]); }}
            style={{
              width: "100%", padding: "14px",
              borderRadius: 14, border: "none",
              background: "linear-gradient(135deg, #C084FC, #FF6B9D)",
              color: "#fff", fontWeight: 900, fontSize: 15,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            閉じる
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 招待するボタン */}
      <button
        onClick={openDialog}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", padding: "14px",
          borderRadius: 18, border: "none",
          background: "linear-gradient(135deg, #C084FC, #FF6B9D)",
          boxShadow: "0 6px 20px rgba(192,132,252,0.4)",
          color: "#fff", fontWeight: 900, fontSize: 15,
          cursor: "pointer", fontFamily: "inherit",
          letterSpacing: "0.02em",
        }}
      >
        <span style={{ fontSize: 20 }}>📨</span>
        参加者を招待する
        <span style={{ fontSize: 16 }}>→</span>
      </button>

      {/* ダイアログ */}
      {open && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(30,10,30,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
          }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div style={{
            background: "#fff", borderRadius: 24,
            width: "100%", maxWidth: 480,
            maxHeight: "85vh", display: "flex", flexDirection: "column",
            boxShadow: "0 24px 80px rgba(255,107,157,0.25)",
          }}>
            {/* ヘッダー */}
            <div style={{
              padding: "16px 20px 12px",
              borderBottom: "1px solid #F3EEF4",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexShrink: 0,
            }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: "#8B7A8E", fontWeight: 600 }}>
                  {step === "event" ? "STEP 1 / 2" : "STEP 2 / 2"}
                </p>
                <h2 style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 800, color: "#1E0A1E" }}>
                  {step === "event" ? "イベントを選択" : "参加者を選択"}
                </h2>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {step === "email" && (
                  <button
                    onClick={() => { setStep("event"); setEmails([""]); setError(""); }}
                    style={{ background: "none", border: "none", fontSize: 12, color: "#8B7A8E", cursor: "pointer", fontFamily: "inherit" }}
                  >← 戻る</button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    width: 30, height: 30, borderRadius: "50%", border: "none",
                    background: "#F3EEF4", color: "#8B7A8E", fontSize: 16,
                    cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >×</button>
              </div>
            </div>

            {/* プログレスバー */}
            <div style={{ height: 3, background: "#F3EEF4", flexShrink: 0 }}>
              <div style={{
                height: "100%", borderRadius: 2,
                width: step === "event" ? "50%" : "100%",
                background: "linear-gradient(90deg, #C084FC, #FF6B9D)",
                transition: "width 0.3s",
              }} />
            </div>

            {/* コンテンツ */}
            <div style={{ overflowY: "auto", flex: 1, padding: "16px 20px" }}>

              {/* STEP1: イベント選択 */}
              {step === "event" && (
                eventsLoading ? (
                  <p style={{ textAlign: "center", color: "#8B7A8E", padding: "32px 0", fontSize: 13 }}>読み込み中...</p>
                ) : events.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#8B7A8E" }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
                    <p style={{ fontSize: 13, margin: 0 }}>イベントがありません</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {events.map(ev => (
                      <button
                        key={ev.id}
                        onClick={() => selectEvent(ev)}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "12px 14px", borderRadius: 14,
                          border: "1.5px solid #F3EEF4", background: "#FAFAFA",
                          cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#FF6B9D"; e.currentTarget.style.background = "#FFF0F6"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#F3EEF4"; e.currentTarget.style.background = "#FAFAFA"; }}
                      >
                        <div style={{
                          width: 40, height: 40, borderRadius: 10,
                          background: "#FFB3D044",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 20, flexShrink: 0,
                        }}>📅</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1E0A1E" }}>{ev.title}</p>
                          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#8B7A8E" }}>{dateStr(ev.startAt)}</p>
                        </div>
                        <span style={{ color: "#C084FC", fontSize: 18 }}>›</span>
                      </button>
                    ))}
                  </div>
                )
              )}

              {/* STEP2: メールアドレス入力 */}
              {step === "email" && (
                <div>
                  {/* 選択中のイベント表示 */}
                  {selectedEvent && (
                    <div style={{
                      padding: "10px 12px", borderRadius: 12,
                      background: "#FFF0F6", border: "1px solid #FFD6E8",
                      marginBottom: 16,
                    }}>
                      <p style={{ margin: 0, fontSize: 11, color: "#8B7A8E" }}>選択中のイベント</p>
                      <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 700, color: "#1E0A1E" }}>{selectedEvent.title}</p>
                    </div>
                  )}

                  {/* メールアドレス入力フォーム */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8B7A8E", marginBottom: 8 }}>
                      招待するメールアドレス
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {emails.map((email, index) => (
                        <div key={index} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <input
                            type="email"
                            value={email}
                            onChange={e => updateEmail(index, e.target.value)}
                            placeholder="example@email.com"
                            style={{
                              flex: 1, padding: "10px 12px", borderRadius: 12,
                              border: `2px solid ${email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? "#FF6B9D" : "#F3EEF4"}`,
                              fontSize: 13, outline: "none",
                              background: "#FFFCFE", fontFamily: "inherit",
                              transition: "border-color 0.15s",
                            }}
                            onFocus={e => { e.currentTarget.style.borderColor = "#C084FC"; }}
                            onBlur={e => {
                              e.currentTarget.style.borderColor =
                                email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? "#FF6B9D" : "#F3EEF4";
                            }}
                          />
                          {emails.length > 1 && (
                            <button
                              onClick={() => removeEmailField(index)}
                              style={{
                                width: 28, height: 28, borderRadius: 8, border: "none",
                                background: "#F3EEF4", color: "#8B7A8E", fontSize: 14,
                                cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}
                            >×</button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={addEmailField}
                      style={{
                        marginTop: 8, display: "flex", alignItems: "center", gap: 6,
                        background: "none", border: "1.5px dashed #D4C8D6",
                        borderRadius: 10, padding: "8px 14px",
                        fontSize: 12, color: "#8B7A8E", cursor: "pointer", fontFamily: "inherit",
                        width: "100%", justifyContent: "center",
                      }}
                    >
                      <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
                      メールアドレスを追加
                    </button>
                  </div>

                  {error && (
                    <p style={{ fontSize: 13, color: "#ef4444", background: "#FFF0F6", padding: "8px 12px", borderRadius: 10, marginBottom: 8 }}>
                      {error}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* フッター */}
            {step === "email" && (
              <div style={{ padding: "12px 20px 24px", borderTop: "1px solid #F3EEF4", flexShrink: 0 }}>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || validEmails.length === 0}
                  style={{
                    width: "100%", padding: "14px",
                    borderRadius: 14, border: "none",
                    background: validEmails.length === 0
                      ? "#E9D5FF"
                      : "linear-gradient(135deg, #C084FC, #FF6B9D)",
                    color: "#fff", fontWeight: 900, fontSize: 15,
                    cursor: validEmails.length === 0 ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    boxShadow: validEmails.length > 0 ? "0 4px 16px rgba(255,107,157,0.35)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {submitting
                    ? "送信中..."
                    : validEmails.length === 0
                    ? "メールアドレスを入力してください"
                    : `${validEmails.length}名に招待メールを送る 📨`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
