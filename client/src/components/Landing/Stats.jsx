// components/Stats.jsx
const stats = [
  { label: 'Properties Listed', value: '1,200+' },
  { label: 'Happy Clients', value: '3,500+' },
  { label: 'Agents', value: '150+' },
];

export default function Stats() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-20 flex flex-col md:flex-row justify-around items-center bg-red-50 rounded-xl shadow-lg">
      {stats.map((s, i) => (
        <div key={i} className="text-center mb-8 md:mb-0">
          <h3 className="text-4xl font-bold text-red-500 mb-2">{s.value}</h3>
          <p className="text-gray-700">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
