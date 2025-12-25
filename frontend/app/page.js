export default async function Home() {
  const res = await fetch("http://localhost:8080/hello", {
    cache: "no-store",
  });

  const data = await res.json();

  return (
    <main style={{ padding: 32 }}>
      <h1>Hello from Next.js (JS)</h1>

      <h2>Messages from workers:</h2>
      <ul>
        {data.map((item, i) => (
          <li key={i}>
            <strong>Worker {item.worker}:</strong> {item.message}
          </li>
        ))}
      </ul>
    </main>
  );
}
