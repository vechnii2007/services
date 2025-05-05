const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "provider", "admin"],
      default: "user",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    providerInfo: {
      completedOffers: {
        type: Number,
        default: 0,
      },
      responseRate: {
        type: Number,
        default: 0,
      },
      totalResponses: {
        type: Number,
        default: 0,
      },
      totalRequests: {
        type: Number,
        default: 0,
      },
      specialization: {
        type: [String],
        default: [],
      },
      languages: {
        type: [String],
        default: [],
      },
      description: {
        type: String,
        trim: true,
        default: "",
      },
      workingHours: {
        type: String,
        trim: true,
        default: "",
      },
      contactPreferences: {
        email: {
          type: Boolean,
          default: true,
        },
        phone: {
          type: Boolean,
          default: true,
        },
        chat: {
          type: Boolean,
          default: true,
        },
      },
    },
    status: {
      type: String,
      enum: ["online", "offline", "away"],
      default: "offline",
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    pushSubscription: {
      type: Object,
      select: false,
    },
    notificationPreferences: {
      messages: {
        type: Boolean,
        default: true,
      },
      offers: {
        type: Boolean,
        default: true,
      },
      statusUpdates: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
    },
    avatar: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

userSchema.methods.updateOnlineStatus = async function (status) {
  this.status = status;
  this.lastSeen = new Date();
  return this.save();
};

userSchema.virtual("isOnline").get(function () {
  return this.status === "online";
});

userSchema.methods.updateNotificationPreferences = async function (
  preferences
) {
  Object.assign(this.notificationPreferences, preferences);
  return this.save();
};

userSchema.methods.incrementCompletedOffers = async function () {
  if (this.role === "provider") {
    this.providerInfo.completedOffers += 1;
    return this.save();
  }
};

userSchema.methods.updateResponseRate = async function () {
  if (this.role === "provider" && this.providerInfo.totalRequests > 0) {
    this.providerInfo.responseRate = Math.round(
      (this.providerInfo.totalResponses / this.providerInfo.totalRequests) * 100
    );
    return this.save();
  }
};

userSchema.methods.incrementTotalResponses = async function () {
  if (this.role === "provider") {
    this.providerInfo.totalResponses += 1;
    return this.updateResponseRate();
  }
};

userSchema.methods.incrementTotalRequests = async function () {
  if (this.role === "provider") {
    this.providerInfo.totalRequests += 1;
    return this.updateResponseRate();
  }
};

module.exports = mongoose.model("User", userSchema);
