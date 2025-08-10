const passport = require("passport");
const User = require("../Model/User");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || "GOOGLE_CLIENT_ID",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "GOOGLE_CLIENT_SECRET",
  callbackURL: "/auth/google/callback"
}, async (req,accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    
    if (!email) {
      return done(new Error("No email found in Google profile"), null);
    }

    let user = await User.findOne({ email });

    if (user) {
      // Update existing user with Google provider info if not set
      if (!user.providerId) {
        user.provider = 'google';
        user.providerId = profile.id;
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        provider: 'google',
        providerId: profile.id,
        username: profile.displayName || profile.name?.givenName || 'Google User',
        email,
        profilePic: profile.photos?.[0]?.value || '',
        role: 'student'
      });
    }
    req.session.isNewUser = true;
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// GitHub Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID || "GITHUB_CLIENT_ID",
  clientSecret: process.env.GITHUB_CLIENT_SECRET || "GITHUB_CLIENT_SECRET",
  callbackURL: "/auth/github/callback"
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    
    if (!email) {
      return done(new Error("No email found in GitHub profile"), null);
    }

    let user = await User.findOne({ email });

    if (user) {
      // Update existing user with GitHub provider info if not set
      if (!user.providerId) {
        user.provider = 'github';
        user.providerId = profile.id;
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        provider: 'github',
        providerId: profile.id,
        username: profile.displayName || profile.username || 'GitHub User',
        email,
        profilePic: profile.photos[0].value || '',
        role: 'student'
      });
    }
    req.session.isNewUser = true;
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// LinkedIn Strategy
passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_CLIENT_ID || "LINKEDIN_CLIENT_ID",
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "LINKEDIN_CLIENT_SECRET",
  callbackURL: "/auth/linkedin/callback",
  scope: ['r_emailaddress', 'r_liteprofile']
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    
    if (!email) {
      return done(new Error("No email found in LinkedIn profile"), null);
    }

    let user = await User.findOne({ email });

    if (user) {
      // Update existing user with LinkedIn provider info if not set
      if (!user.providerId) {
        user.provider = 'linkedin';
        user.providerId = profile.id;
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        provider: 'linkedin',
        providerId: profile.id,
        username: profile.displayName || 'LinkedIn User',
        email: profile._json.email || email,
        profilePic: profile.photos[0].value || '',
        role: 'student'
      });
    }

    req.session.isNewUser = true;
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));