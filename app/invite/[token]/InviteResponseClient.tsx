"use client";

import { useState } from "react";
import QRCode from "react-qr-code";

const S = {
  input: { width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid #F3EEF4", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const, background: "#FFFCFE" },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#8B7A8E", marginBottom: 6 } as React.CSSProperties,
};

interface Props {
  token: string;
  alreadyAccepted: boolean;
  requiresTicket: boolean;
  initialStatus: string;
  initialResponseNote: string | null;
}

// info : 名前・電話番号入力 → SMS送信
// code : SMS認証コード入力 → 参加登録する（直接API送信）
type Phase = "info" | "code";

export default function InviteResponseClient({ token, alreadyAccepted, requiresTicket, initialStatus, initialResponseNote }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [qrToken, setQrToken] = useState<string | null>(null);

  const [name,       setName]  = useState("");
  const [phone,      setPhone] = useState("");
  const [ticketCode, setTicketCode] = useState("");

  // PENDING招待は常にSMS認証フローを通す。ACCEPTEDの場合のみスキップ。
  const [phase,          setPhase]          = useState<Phase>(alreadyAccepted ? "info" : "info");
  const [smsCode,        setSmsCode]        = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [smsSending,     setSmsSending]     = useState(false);
  const [countdown,      setCountdown]      = useState(0);

  // 回答済み表示
  if (status === "ACCEPTED" || status === "DECLINED") {
    const ticketUrl = qrToken
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/ticket/${qrToken}`
      : null;
    return (
      <div style={{
        borderRadius: 16, padding: 20, textAlign: "center",
        background: status === "ACCEPTED" ? "#FFF0F6" : "#F3EEF4",
        border: `2px solid ${status === "ACCEPTED" ? "#FF6B9D" : "#E9D5FF"}`,
      }}>
        <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: status === "ACCEPTED" ? "#FF6B9D" : "#8B7A8E" }}>
          {status === "ACCEPTED" ? "🎉 参加登録完了！" : "😔 キャンセル"}
        </p>
        <p style={{ margin: "10px 0 0", fontSize: 11, color: "#8B7A8E" }}>回答を受け付けました</p>
        {ticketUrl && (
          <div style={{ marginTop: 20 }}>
            <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#8B7A8E" }}>入場用QRコード</p>
            <div style={{ display: "inline-block", padding: 16, background: "#fff", borderRadius: 16, boxShadow: "0 4px 16px rgba(255,107,157,0.15)" }}>
              <QRCode value={ticketUrl} size={180} />
            </div>
            <p style={{ margin: "10px 0 0", fontSize: 10, color: "#8B7A8E" }}>このQRコードをスタッフに提示してください</p>
          </div>
        )}
      </div>
    );
  }

  // STEP1: 名前・電話番号 → SMS送信
  async function sendSmsCode() {
    if (!name.trim()) { setError("お名前を入力してください"); return; }
    if (!phone.trim()) { setError("電話番号を入力してください"); return; }
    setError("");
    setSmsSending(true);
    try {
      const res = await fetch("/api/sms/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      let data: { error?: string; verificationId?: string; mockCode?: string } = {};
      try { data = await res.json(); } catch { /* ignore */ }
      if (!res.ok) {
        setError(data.error ?? "SMS送信に失敗しました（しばらく後に再試行してください）");
        return;
      }
      setVerificationId(data.verificationId ?? "");
      if (data.mockCode) {
        console.log(`%c[Re:invite] SMS認証コード (開発モード): ${data.mockCode}`, "color: #FF6B9D; font-weight: bold; font-size: 14px;");
      }
      setSmsCode("");
      setPhase("code");
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setError("通信エラーが発生しました。ネットワークを確認してください");
    } finally {
      setSmsSending(false);
    }
  }

  // STEP2: SMS認証コード確認 → 直接API送信
  async function handleSubmit() {
    if (smsCode.length < 6) { setError("6桁の認証コードを入力してください"); return; }
    if (requiresTicket && !ticketCode.trim()) { setError("チケット番号を入力してください"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "ACCEPTED",
          name: name.trim(),
          phone: phone.trim(),
          smsCode: smsCode.trim(),
          verificationId,
          ...(requiresTicket ? { ticketCode: ticketCode.trim() } : {}),
        }),
      });
      let data: { error?: string; qrToken?: string } = {};
      try { data = await res.json(); } catch { /* ignore */ }
      if (!res.ok) { setError(data.error ?? "エラーが発生しました"); return; }
      setQrToken(data.qrToken ?? null);
      setStatus("ACCEPTED");
    } catch {
      setError("通信エラーが発生しました。ネットワークを確認してください");
    } finally {
      setLoading(false);
    }
  }

  async function handleDecline() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DECLINED" }),
      });
      let data: { error?: string } = {};
      try { data = await res.json(); } catch { /* ignore */ }
      if (!res.ok) { setError(data.error ?? "エラーが発生しました"); return; }
      setStatus("DECLINED");
    } catch {
      setError("通信エラーが発生しました。ネットワークを確認してください");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ borderTop: "1px solid #F3EEF4", paddingTop: 16 }}>

      {/* STEP1: 名前・電話番号入力 */}
      {phase === "info" && (
        <div>
          <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#1E0A1E" }}>参加登録フォーム</p>

          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>お名前 <span style={{ color: "#FF6B9D" }}>*</span></label>
            <input style={S.input} type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="山田 花子"
              onFocus={e => e.target.style.borderColor = "#FF6B9D"}
              onBlur={e => e.target.style.borderColor = "#F3EEF4"} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>電話番号 <span style={{ color: "#FF6B9D" }}>*</span></label>
            <input style={S.input} type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="09012345678"
              onFocus={e => e.target.style.borderColor = "#FF6B9D"}
              onBlur={e => e.target.style.borderColor = "#F3EEF4"} />
          </div>

          {requiresTicket && (
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>チケット番号 <span style={{ color: "#FF6B9D" }}>*</span></label>
              <input style={{ ...S.input, fontFamily: "monospace", letterSpacing: "0.1em" }}
                type="text" value={ticketCode} onChange={e => setTicketCode(e.target.value)}
                placeholder="例：T001"
                onFocus={e => e.target.style.borderColor = "#FF6B9D"}
                onBlur={e => e.target.style.borderColor = "#F3EEF4"} />
            </div>
          )}

          {error && (
            <div style={{ background: "#FFF0F6", borderRadius: 12, padding: "10px 14px", marginBottom: 14, borderLeft: "3px solid #FF6B9D" }}>
              <p style={{ margin: 0, fontSize: 13, color: "#1E0A1E" }}>{error}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleDecline} disabled={loading}
              style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", background: "#F3EEF4", color: "#8B7A8E", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              キャンセル
            </button>
            <button onClick={sendSmsCode} disabled={smsSending}
              style={{ flex: 2, padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #FF6B9D, #C084FC)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: smsSending ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(255,107,157,0.4)", opacity: smsSending ? 0.6 : 1 }}>
              {smsSending ? "送信中..." : "認証コードを送る"}
            </button>
          </div>
        </div>
      )}

      {/* STEP2: SMS認証コード入力 → 参加登録する */}
      {phase === "code" && (
        <div>
          <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#1E0A1E" }}>SMS認証</p>

          <div style={{ background: "#FFF0F6", borderRadius: 14, padding: "12px 14px", marginBottom: 12, border: "1px solid #FFD6E8" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#8B7A8E" }}>
              📱 <strong>{phone}</strong> に6桁の認証コードを送信しました
            </p>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={S.label}>認証コード <span style={{ color: "#FF6B9D" }}>*</span></label>
            <input
              style={{ ...S.input, fontFamily: "monospace", letterSpacing: "0.3em", fontSize: 20, textAlign: "center" }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={smsCode}
              onChange={e => setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              onFocus={e => e.target.style.borderColor = "#FF6B9D"}
              onBlur={e => e.target.style.borderColor = "#F3EEF4"}
            />
          </div>

          <div style={{ textAlign: "right", marginBottom: 16 }}>
            <button
              onClick={sendSmsCode}
              disabled={smsSending || countdown > 0}
              style={{ background: "none", border: "none", fontSize: 12, color: countdown > 0 ? "#8B7A8E" : "#FF6B9D", cursor: countdown > 0 ? "default" : "pointer", fontFamily: "inherit" }}
            >
              {countdown > 0 ? `再送信まで ${countdown}秒` : "コードを再送信"}
            </button>
          </div>

          {error && (
            <div style={{ background: "#FFF0F6", borderRadius: 12, padding: "10px 14px", marginBottom: 14, borderLeft: "3px solid #FF6B9D" }}>
              <p style={{ margin: 0, fontSize: 13, color: "#1E0A1E" }}>{error}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setPhase("info"); setSmsCode(""); setVerificationId(""); setError(""); }}
              style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", background: "#F3EEF4", color: "#8B7A8E", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              戻る
            </button>
            <button onClick={handleSubmit} disabled={loading || smsCode.length < 6}
              style={{ flex: 2, padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #FF6B9D, #C084FC)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: loading || smsCode.length < 6 ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(255,107,157,0.4)", opacity: loading || smsCode.length < 6 ? 0.5 : 1 }}>
              {loading ? "送信中..." : "参加登録する"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
