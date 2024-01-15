export const signUp = async (payload) => {
  const res = await fetch(
    "https://real-estate-website-uvk2.onrender.com/api/auth/signup",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  return res.json();
};

export const signIn = async (payload) => {
  const res = await fetch(
    "https://real-estate-website-uvk2.onrender.com/api/auth/signin",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  return res.json();
};
