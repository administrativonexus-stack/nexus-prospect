export const dynamic = "force-dynamic"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex items-center justify-center bg-background p-4 relative overflow-hidden bg-dot-grid">
      {/* Violet radial spotlight — creates depth behind the login card */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% -5%, oklch(0.488 0.243 264 / 15%), transparent 65%)",
        }}
        aria-hidden="true"
      />
      {/* Warm bottom fade to prevent the grid from feeling too stark */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background: "linear-gradient(to top, oklch(0.11 0 0), transparent)",
        }}
        aria-hidden="true"
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
