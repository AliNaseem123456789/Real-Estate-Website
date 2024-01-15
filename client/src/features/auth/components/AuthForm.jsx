export default function AuthForm({
  title,
  fields,
  onSubmit,
  loading,
  error,
  submitText,
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <h2 className="text-3xl font-bold text-center">{title}</h2>

      {fields.map(({ id, label, type, onChange }) => (
        <div key={id}>
          <label className="block font-medium">{label}</label>
          <input
            id={id}
            type={type}
            onChange={onChange}
            className="w-full border rounded-xl px-4 py-3"
          />
        </div>
      ))}

      <button disabled={loading} className="btn-primary">
        {loading ? "Loading..." : submitText}
      </button>

      {error && <p className="text-red-500 text-center">{error}</p>}
    </form>
  );
}
