"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type CheckinResult = {
  ok: boolean;
  guestName?: string;
  eventTitle?: string;
  alreadyCheckedIn?: boolean;
  message?: string;
};

export default function ScanClient({ eventId }: { eventId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const lastTokenRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualToken, setManualToken] = useState("");

  const doCheckin = useCallback(async (token: string) => {
    if (!token) return;
    setScanning(true);
    setResult(null);
    try {
      const res = await fetch("/api/ticket/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken: token }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, guestName: data.guestName, eventTitle: data.eventTitle, alreadyCheckedIn: false });
      } else if (res.status === 409) {
        setResult({ ok: true, guestName: data.guestName, eventTitle: data.eventTitle, alreadyCheckedIn: true });
      } else {
        setResult({ ok: false, message: data.error });
      }
    } catch {
      setResult({ ok: false, message: "通信エラーが発生しました" });
    } finally {
      setScanning(false);
    }
  }, []);

  const scanLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) { rafRef.current = requestAnimationFrame(scanLoop); return; }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // jsQR は動的インポート
    import("jsqr").then(({ default: jsQR }) => {
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code?.data) {
        const token = extractToken(code.data);
        const now = Date.now();
        if (token && token !== lastTokenRef.current && now - lastScanTimeRef.current > 3000) {
          lastTokenRef.current = token;
          lastScanTimeRef.current = now;
          doCheckin(token);
        }
      }
    });

    rafRef.current = requestAnimationFrame(scanLoop);
  }, [doCheckin]);

  function extractToken(data: string): string {
    // /invite/TOKEN 形式のURLまたはトークン直接
    try {
      const url = new URL(data);
      const parts = url.pathname.split("/");
      return parts[parts.length - 1];
    } catch {
      return data.trim();
    }
  }

  async function startCamera() {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      rafRef.current = requestAnimationFrame(scanLoop);
    } catch {
      setCameraError("カメラへのアクセスが拒否されました。ブラウザの設定を確認してください。");
    }
  }

  function stopCamera() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* カメラ映像 */}
      <div className="relative bg-black rounded-2xl overflow-hidden aspect-square">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />

        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <p className="text-white/60 text-sm">カメラが停止中</p>
            <button
              onClick={startCamera}
              className="px-5 py-2.5 text-white font-bold rounded-xl text-sm"
              style={{ background: "linear-gradient(135deg, #ff2d8b, #e8007a)" }}
            >
              カメラを起動
            </button>
          </div>
        )}

        {cameraActive && (
          <>
            {/* スキャン枠 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-4 border-white/60 rounded-2xl" />
            </div>
            <button
              onClick={stopCamera}
              className="absolute top-3 right-3 px-3 py-1.5 bg-black/50 text-white text-xs rounded-lg"
            >
              停止
            </button>
          </>
        )}
      </div>

      {cameraError && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">{cameraError}</p>
      )}

      {/* スキャン結果 */}
      {scanning && (
        <div className="text-center py-4 text-gray-500 text-sm">確認中...</div>
      )}

      {result && (
        <div className={`rounded-2xl p-5 ${result.ok ? "" : "bg-red-50 border border-red-100"}`}
          style={result.ok ? { background: result.alreadyCheckedIn ? "#fff8e1" : "#fff0f7", border: `2px solid ${result.alreadyCheckedIn ? "#f59e0b" : "#ff2d8b"}` } : {}}
        >
          {result.ok ? (
            <>
              <p className="text-2xl font-black" style={{ color: result.alreadyCheckedIn ? "#d97706" : "#ff2d8b" }}>
                {result.alreadyCheckedIn ? "⚠ 既に来場済み" : "✓ チェックイン完了"}
              </p>
              <p className="font-bold text-gray-800 mt-2">{result.guestName}</p>
              <p className="text-sm text-gray-500">{result.eventTitle}</p>
            </>
          ) : (
            <>
              <p className="text-lg font-black text-red-500">✗ 無効なQRコード</p>
              <p className="text-sm text-gray-600 mt-1">{result.message}</p>
            </>
          )}
        </div>
      )}

      {/* 手動入力 */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-400 mb-2">手動入力（トークンまたは招待URL）</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="トークンを入力..."
            className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-idol-400 bg-gray-50"
          />
          <button
            onClick={() => { doCheckin(extractToken(manualToken)); setManualToken(""); }}
            disabled={!manualToken || scanning}
            className="px-4 py-2.5 text-white font-bold rounded-xl text-sm disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #ff2d8b, #e8007a)" }}
          >
            確認
          </button>
        </div>
      </div>
    </div>
  );
}
