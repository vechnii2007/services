const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
require("dotenv").config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("[GoogleStrategy] profile:", JSON.stringify(profile));
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          // Если пользователя с таким googleId нет, ищем по email
          const email =
            profile.emails && profile.emails[0] && profile.emails[0].value;
          console.log("[GoogleStrategy] Поиск по email:", email);
          user = await User.findOne({ email });
          if (user) {
            console.log("[GoogleStrategy] Найден user по email:", user._id);
            user.googleId = profile.id;
            user.socialLogin = true;
            await user.save();
          } else {
            console.log(
              "[GoogleStrategy] Создаю нового пользователя через Google:",
              email
            );
            user = await User.create({
              googleId: profile.id,
              name: profile.displayName || "Google User",
              email: email,
              password: Math.random().toString(36).slice(-8), // временный пароль
              socialLogin: true,
            });
            console.log("[GoogleStrategy] Новый user создан:", user._id);
          }
        } else {
          console.log("[GoogleStrategy] Найден user по googleId:", user._id);
        }
        return done(null, user);
      } catch (err) {
        console.error("[GoogleStrategy] Ошибка:", err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
