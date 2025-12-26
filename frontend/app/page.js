export default async function Home() {
  const res = await fetch("http://localhost:8080/health", {
    cache: "no-store",
  });

  const data = await res.json();

  return (
    <main style={{ padding: 32 }}>
      <h1>Hello from Next.js (JS)</h1>

      <h2>Messages from workers:</h2>
      <ul>
        <strong>status {data.status}</strong>
      </ul>
    </main>
  );
}
