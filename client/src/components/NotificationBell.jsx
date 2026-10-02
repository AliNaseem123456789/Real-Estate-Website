import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import { api } from "../utils/api";
import { useLanguage } from "../i18n";

const CHECK_EVERY_MS = 60 * 1000; // look for new notifications once a minute

// Bell icon with unread count; click to see price drops, new matches and enquiries
export default function NotificationBell() {
  const { t } = useLanguage();
  const [data, setData] = useState({ notifications: [], unreadCount: 0 });
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  const load = () =>
    api("/notifications")
      .then(setData)
      .catch(() => {});

  useEffect(() => {
    load();
    const timer = setInterval(load, CHECK_EVERY_MS);
    return () => clearInterval(timer);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const markAllRead = async () => {
    await api("/notifications/read-all", { method: "PATCH" }).catch(() => {});
    load();
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative text-white text-xl p-1"
        aria-label={t("notifications")}
      >
        <FaBell />
        {data.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
            {data.unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 mt-2 w-80 max-w-[90vw] bg-white rounded-xl shadow-2xl z-50 overflow-hidden text-gray-800">
          <div className="flex justify-between items-center px-4 py-3 border-b">
            <span className="font-semibold">{t("notifications")}</span>
            {data.unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-indigo-600 hover:underline">
                {t("markAllRead")}
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {data.notifications.length === 0 && (
              <p className="p-4 text-sm text-gray-500">{t("noNotifications")}</p>
            )}
            {data.notifications.map((item) => (
              <Link
                key={item._id}
                to={item.link || "#"}
                onClick={() => setOpen(false)}
                className={`block px-4 py-3 text-sm border-b hover:bg-gray-50 ${item.read ? "" : "bg-indigo-50"}`}
              >
                <p>{item.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(item.createdAt).toLocaleString()}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
