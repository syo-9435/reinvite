export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #FF6B9D 0%, #FF9EC4 50%, #C084FC 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* floating shapes */}
      {[
        { w: 160, h: 160, top: -50, right: -50, c: "rgba(255,255,255,0.15)" },
        { w: 80,  h: 80,  bottom: 40, left: 20,  c: "rgba(233,213,255,0.25)" },
        { w: 40,  h: 40,  top: "30%", left: "10%", c: "rgba(255,255,255,0.2)" },
      ].map((s, i) => (
        <div key={i} style={{
          position: "absolute",
          borderRadius: "50%",
          width: s.w, height: s.h,
          top: s.top, bottom: s.bottom, left: s.left, right: s.right,
          background: s.c,
        }} />
      ))}
      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
