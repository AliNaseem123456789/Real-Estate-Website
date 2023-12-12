// components/Testimonials.jsx
const testimonials = [
  {
    name: 'John Doe',
    role: 'Homeowner',
    photo: 'https://randomuser.me/api/portraits/men/32.jpg',
    feedback: 'Finding my dream home was so easy with this platform! Highly recommended.',
  },
  {
    name: 'Jane Smith',
    role: 'Investor',
    photo: 'https://randomuser.me/api/portraits/women/44.jpg',
    feedback: 'Great listings and excellent customer support. Truly modern experience.',
  },
  {
    name: 'Mike Johnson',
    role: 'Tenant',
    photo: 'https://randomuser.me/api/portraits/men/55.jpg',
    feedback: 'I found the perfect rental within days! Simple and fast.',
  },
];

export default function Testimonials() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-20 bg-gray-50">
      <h2 className="text-3xl font-bold text-center mb-12">What Our Clients Say</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {testimonials.map((t, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition flex flex-col items-center text-center"
          >
            <img
              src={t.photo}
              alt={t.name}
              className="w-20 h-20 rounded-full mb-4 object-cover"
            />
            <p className="text-gray-700 mb-4">&quot;{t.feedback}&quot;</p>
            <h3 className="font-semibold">{t.name}</h3>
            <span className="text-gray-500 text-sm">{t.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
