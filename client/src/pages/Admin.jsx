import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../utils/api";
import { formatPrice, PLACEHOLDER_IMAGE } from "../utils/format";

// ---------- Listings ----------
function AdminListings({ status, onChange }) {
  const [listings, setListings] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = () =>
    api(`/admin/properties?status=${status}&q=${encodeURIComponent(search)}`)
      .then(setListings)
      .catch((err) => setError(err.message));

  useEffect(() => {
    setListings(null);
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search]);

  const run = async (request) => {
    try {
      await request;
      load();
      onChange();
    } catch (err) {
      setError(err.message);
    }
  };

  const approve = (p, approved) =>
    run(api(`/admin/properties/${p._id}`, { method: "PATCH", body: { approved } }));
  const clearReports = (p) => run(api(`/admin/properties/${p._id}/clear-reports`, { method: "POST" }));
  const remove = (p) => {
    if (window.confirm(`Delete "${p.title}" for good?`)) {
      run(api(`/admin/properties/${p._id}`, { method: "DELETE" }));
    }
  };

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by title"
        className="w-full sm:w-80 px-3 py-2 border rounded-md mb-4"
      />
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {!listings && <p className="text-gray-500">Loading...</p>}
      {listings?.length === 0 && <p className="text-gray-500">Nothing here 🎉</p>}

      <div className="space-y-4">
        {listings?.map((p) => (
          <div key={p._id} className="bg-white rounded-xl shadow p-4 flex flex-col md:flex-row gap-4">
            <img src={p.images[0] || PLACEHOLDER_IMAGE} alt="" className="w-full md:w-40 h-28 object-cover rounded-lg" />
            <div className="flex-1">
              <Link to={`/properties/${p._id}`} className="font-semibold hover:underline">
                {p.title}
              </Link>
              <p className="text-sm text-gray-500">
                {p.city} · {formatPrice(p.price)} · by {p.owner?.username || p.publisher_name}
              </p>
              <p className="text-xs mt-1">
                {p.approved === false ? (
                  <span className="text-yellow-700">Hidden / waiting for approval</span>
                ) : (
                  <span className="text-green-700">Live</span>
                )}
              </p>
              {p.reports?.length > 0 && (
                <ul className="mt-2 text-sm text-red-700 list-disc ms-5">
                  {p.reports.map((r) => (
                    <li key={r._id}>
                      &quot;{r.reason}&quot; — {r.user?.username || "user"}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex md:flex-col gap-2 flex-wrap">
              {p.approved === false ? (
                <button onClick={() => approve(p, true)} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm">
                  Approve
                </button>
              ) : (
                <button onClick={() => approve(p, false)} className="px-3 py-2 border rounded-lg text-sm">
                  Hide
                </button>
              )}
              {p.reports?.length > 0 && (
                <button onClick={() => clearReports(p)} className="px-3 py-2 border rounded-lg text-sm">
                  Clear reports
                </button>
              )}
              <button onClick={() => remove(p)} className="px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Users ----------
function AdminUsers({ onChange }) {
  const [users, setUsers] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = () =>
    api(`/admin/users?q=${encodeURIComponent(search)}`)
      .then(setUsers)
      .catch((err) => setError(err.message));

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const update = async (user, changes) => {
    try {
      await api(`/admin/users/${user._id}`, { method: "PATCH", body: changes });
      load();
      onChange();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email"
        className="w-full sm:w-80 px-3 py-2 border rounded-md mb-4"
      />
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-start">
            <tr>
              <th className="p-3 text-start">User</th>
              <th className="p-3">Agent</th>
              <th className="p-3">Verified</th>
              <th className="p-3">Admin</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((user) => (
              <tr key={user._id} className="border-t">
                <td className="p-3">
                  <Link to={`/agents/${user._id}`} className="font-semibold hover:underline">
                    {user.username}
                  </Link>
                  <p className="text-gray-500">{user.email}</p>
                </td>
                <td className="p-3 text-center">
                  <input type="checkbox" checked={user.isAgent} onChange={(e) => update(user, { isAgent: e.target.checked })} />
                </td>
                <td className="p-3 text-center">
                  <input type="checkbox" checked={user.verified} onChange={(e) => update(user, { verified: e.target.checked })} />
                </td>
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={user.role === "admin"}
                    onChange={(e) => update(user, { role: e.target.checked ? "admin" : "user" })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const TABS = [
  ["pending", "Waiting for approval"],
  ["reported", "Reported"],
  ["all", "All listings"],
  ["users", "Users & agents"],
];

export default function Admin() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "pending";
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  const loadStats = () =>
    api("/admin/stats")
      .then(setStats)
      .catch((err) => setError(err.message));

  useEffect(() => {
    loadStats();
  }, []);

  if (error) return <p className="text-center py-20 text-gray-700">{error}</p>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Admin</h1>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            ["Listings", stats.properties],
            ["Waiting", stats.pending],
            ["Reported", stats.reported],
            ["Users", stats.users],
            ["Agents", stats.agents],
          ].map(([label, value]) => (
            <div key={label} className="bg-white rounded-xl shadow p-4 text-center">
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6 border-b">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSearchParams({ tab: key })}
            className={`px-4 py-2 -mb-px border-b-2 font-semibold ${
              tab === key ? "border-red-500 text-red-600" : "border-transparent text-gray-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "users" ? (
        <AdminUsers onChange={loadStats} />
      ) : (
        <AdminListings status={tab} onChange={loadStats} />
      )}
    </div>
  );
}
