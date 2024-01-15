import { useEffect, useState } from "react";

export default function AnimatedPanel({ lines }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => setCurrent((prev) => (prev + 1) % lines.length),
      3000
    );
    return () => clearInterval(interval);
  }, [lines.length]);

  return (
    <div className="hidden lg:flex w-1/2 bg-gray-900 items-center justify-center">
      {lines.map((line, i) => (
        <h1
          key={i}
          className={`absolute text-5xl text-white transition-all ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        >
          {line}
        </h1>
      ))}
    </div>
  );
}
