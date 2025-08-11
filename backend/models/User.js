import mongoose from "mongoose";
import bcrypt from "bcrypt";

// Define schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // don't return password in queries by default
    },
    profile_picture: {
      type: String,
      default: null, // optional field
    },
    status: {
      type: String,
      enum: ["online", "offline", "active"],
      default: "offline",
    },
  },
  {
    timestamps: true, // automatically adds createdAt & updatedAt
  }
);

//
// Middleware: Hash password before saving
//
userSchema.pre("save", async function (next) {
  // Only hash if password is modified or new
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

//
// Instance method: Compare passwords
//
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

//
// Model
//
const User = mongoose.model("User", userSchema);

export default User;
