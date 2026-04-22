"use client";

import QRCode from "react-qr-code";
import { useEffect, useState } from "react";

interface Props {
  token: string;
  size?: number;
}

export default function QRCodeDisplay({ token, size = 220 }: Props) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}/invite/${token}`);
  }, [token]);

  if (!url) return <div style={{ width: size, height: size }} className="bg-gray-100 rounded-xl animate-pulse" />;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
        <QRCode value={url} size={size} />
      </div>
      <p className="text-xs text-gray-400 break-all text-center max-w-xs">{url}</p>
    </div>
  );
}
