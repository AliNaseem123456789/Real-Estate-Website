// components/Pricing.jsx
const plans = [
  { title: 'Basic', price: '$19/mo', features: ['Feature 1', 'Feature 2'] },
  { title: 'Pro', price: '$49/mo', features: ['Feature 1', 'Feature 2', 'Feature 3'] },
  { title: 'Enterprise', price: '$99/mo', features: ['All features'] },
];

export default function Pricing() {
  return (
    <div className="max-w-6xl mx-auto py-20 px-4">
      <h2 className="text-3xl font-bold text-center mb-12">Pricing</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-md text-center">
            <h3 className="text-xl font-semibold mb-4">{plan.title}</h3>
            <p className="text-3xl font-bold mb-6">{plan.price}</p>
            <ul className="mb-6 text-gray-600 space-y-2">
              {plan.features.map((f, j) => (
                <li key={j}>{f}</li>
              ))}
            </ul>
            <button className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
              Get Started
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
