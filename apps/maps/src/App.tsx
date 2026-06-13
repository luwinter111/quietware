import { useEffect, useRef, useState } from "react";

interface Place {
  name: string;
  category: string;
  lat: number;
  lon: number;
}
const json = (r: Response) => (r.ok ? r.json() : r.json().then((e) => Promise.reject(new Error(e.error))));
// Leaflet 从 CDN 加载,全局 L。
declare const L: any;

export function App() {
  const [q, setQ] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapRef.current && typeof L !== "undefined") {
      const m = L.map("map").setView([35.86, 104.2], 4);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(m);
      mapRef.current = m;
    }
  }, []);

  function showOnMap(list: Place[]) {
    const m = mapRef.current;
    if (!m) return;
    markersRef.current.forEach((mk) => m.removeLayer(mk));
    markersRef.current = list.map((p) => L.marker([p.lat, p.lon]).addTo(m).bindPopup(p.name));
    if (list.length) m.setView([list[0].lat, list[0].lon], 13);
  }

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setErr("");
    try {
      const list: Place[] = await fetch(`/api/search?q=${encodeURIComponent(q)}`).then(json);
      setPlaces(list);
      showOnMap(list);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function focus(p: Place) {
    mapRef.current?.setView([p.lat, p.lon], 16);
  }

  return (
    <div className="layout">
      <aside>
        <h1>Quietware<span>Maps</span></h1>
        <p className="sub">OpenStreetMap 数据 · 无竞价排名 · 无推广</p>
        <form onSubmit={search}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜地点,如 故宫 / 咖啡馆" />
          <button disabled={loading}>{loading ? "…" : "搜"}</button>
        </form>
        {err && <p className="err">⚠️ {err}</p>}
        <ul className="results">
          {places.map((p, i) => (
            <li key={i} onClick={() => focus(p)}>
              <span className="cat">{p.category}</span>
              <span className="nm">{p.name}</span>
            </li>
          ))}
        </ul>
      </aside>
      <div id="map" />
    </div>
  );
}
