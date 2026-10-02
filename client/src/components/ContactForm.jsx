import { useState } from "react";

// Opens the visitor's email app with the message filled in.
// toEmail: who receives it (defaults to the site's contact email)
export default function ContactForm({
  toEmail = import.meta.env.VITE_CONTACT_EMAIL,
  subject = "Message from Profit Builders website",
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    description: "",
  });
  const [sent, setSent] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const body = [
      formData.description,
      "",
      `Name: ${formData.name}`,
      `Email: ${formData.email}`,
      formData.phoneNumber && `Phone: ${formData.phoneNumber}`,
    ]
      .filter((line) => line !== "")
      .join("\n");

    window.location.href = `mailto:${toEmail}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  if (!toEmail) {
    return <p className="text-gray-600 text-center">Contact email is not set up yet.</p>;
  }

  const inputClass =
    "w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:border-gray-500";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
          Name
        </label>
        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className={inputClass} required />
      </div>

      <div>
        <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
          Email
        </label>
        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} required />
      </div>

      <div>
        <label htmlFor="phoneNumber" className="block text-gray-700 font-medium mb-2">
          Phone Number
        </label>
        <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className={inputClass} />
      </div>

      <div>
        <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
          Message
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="4"
          className={`${inputClass} resize-none`}
          required
        />
      </div>

      <button
        type="submit"
        className="bg-gray-800 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-colors w-full"
      >
        Send
      </button>
      {sent && (
        <p className="text-green-600 text-sm text-center">
          Your email app should open with the message ready to send.
        </p>
      )}
    </form>
  );
}
