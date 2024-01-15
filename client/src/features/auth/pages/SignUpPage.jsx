import { useNavigate } from "react-router-dom";
import { signUp } from "../services/authService";
import { useAuthForm } from "../hooks/useAuthForm";
import AuthForm from "../components/AuthForm";
import AnimatedPanel from "../components/AnimatedPanel";

export default function SignUpPage() {
  const navigate = useNavigate();

  const { handleChange, handleSubmit, loading, error } = useAuthForm(
    async (data) => {
      const res = await signUp(data);
      if (res.success === false) throw new Error(res.message);
      navigate("/sign-in");
    }
  );

  return (
    <div className="flex min-h-screen">
      <AnimatedPanel
        lines={["Join Us Today!", "Build Your Property Profile"]}
      />

      <div className="flex w-full lg:w-1/2 items-center justify-center">
        <AuthForm
          title="Sign Up"
          submitText="Sign Up"
          loading={loading}
          error={error}
          onSubmit={handleSubmit}
          fields={[
            {
              id: "username",
              label: "Username",
              type: "text",
              onChange: handleChange,
            },
            {
              id: "email",
              label: "Email",
              type: "email",
              onChange: handleChange,
            },
            {
              id: "password",
              label: "Password",
              type: "password",
              onChange: handleChange,
            },
          ]}
        />
      </div>
    </div>
  );
}
