"use client";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="nl">
      <body
        style={{
          margin: 0,
          fontFamily: "sans-serif",
          textAlign: "center",
          paddingTop: "4rem",
        }}
      >
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
          Er is een onverwachte fout opgetreden
        </h2>
        {process.env.NODE_ENV === "development" && (
          <p style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#dc2626" }}>
            {error.message}
          </p>
        )}
        <button
          type="button"
          onClick={unstable_retry}
          style={{ marginTop: "1rem", padding: "0.5rem 1rem", cursor: "pointer" }}
        >
          Opnieuw proberen
        </button>
      </body>
    </html>
  );
}
