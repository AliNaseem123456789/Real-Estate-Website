import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import User from "../models/user.model.js";
import { createError } from "../utils/createError.js";

// Only the project id is needed to check Google sign-in tokens
const firebaseApp = initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
};

// Logs the user in: sets the cookie and returns the user without the password
const sendLoginResponse = (res, user) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  const { password, ...userWithoutPassword } = user._doc;

  res
    .cookie("access_token", token, { ...cookieOptions, maxAge: SEVEN_DAYS })
    .status(200)
    .json(userWithoutPassword);
};

export const signup = async (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return next(createError(400, "Username, email and password are required"));
  }
  if (password.length < 6) {
    return next(createError(400, "Password must be at least 6 characters"));
  }

  try {
    const hashedPassword = bcryptjs.hashSync(password, 10);
    await User.create({ username, email, password: hashedPassword });
    res.status(201).json("User created successfully");
  } catch (error) {
    if (error.code === 11000) {
      return next(createError(409, "That username or email is already taken"));
    }
    next(error);
  }
};

export const signin = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(createError(400, "Email and password are required"));
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !bcryptjs.compareSync(password, user.password)) {
      return next(createError(401, "Wrong email or password"));
    }
    sendLoginResponse(res, user);
  } catch (error) {
    next(error);
  }
};

// The browser sends the Firebase ID token; we check it with Google
// instead of trusting an email sent by the browser.
export const google = async (req, res, next) => {
  const { idToken } = req.body;
  if (!idToken) return next(createError(400, "Missing Google token"));

  let googleUser;
  try {
    googleUser = await getAuth(firebaseApp).verifyIdToken(idToken);
  } catch {
    return next(createError(401, "Google sign-in failed, please try again"));
  }

  try {
    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      const randomPassword =
        Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const name = googleUser.name || googleUser.email.split("@")[0];

      user = await User.create({
        username:
          name.split(" ").join("").toLowerCase() + Math.random().toString(36).slice(-4),
        email: googleUser.email,
        password: bcryptjs.hashSync(randomPassword, 10),
        avatar: googleUser.picture,
      });
    }

    sendLoginResponse(res, user);
  } catch (error) {
    next(error);
  }
};

export const signOut = (req, res) => {
  res.clearCookie("access_token", cookieOptions);
  res.status(200).json("User has been logged out");
};
