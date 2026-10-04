export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        background: "#0a0a0c",
        color: "#f9f9f8",
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
      }}
    >
      <section>
        <p style={{ margin: 0, fontSize: "clamp(5rem, 18vw, 10rem)", lineHeight: 1, fontWeight: 800 }}>404</p>
        <h1 style={{ margin: "1rem 0 0", fontSize: "1.5rem" }}>Page not found</h1>
      </section>
    </main>
  );
}
