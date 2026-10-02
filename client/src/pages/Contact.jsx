import ContactForm from "../components/ContactForm";

export default function Contact() {
  return (
    <div className="px-4 py-12">
      <div className="bg-white p-6 sm:p-10 rounded-lg shadow-md max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-6 text-center">Contact Us</h1>
        <ContactForm />
      </div>
    </div>
  );
}
