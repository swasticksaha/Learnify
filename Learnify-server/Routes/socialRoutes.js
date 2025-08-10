const express = require("express");
const passport = require("passport");

const router = express.Router();

// Google OAuth routes
router.get("/google", passport.authenticate("google", { 
  scope: ["profile", "email"] // Added email scope
}));

router.get("/google/callback", 
  passport.authenticate("google", { failureRedirect: "http://localhost:5173/?error=google_auth_failed", session: true }),
  (req, res) => {
    const redirectTo = req.session.isNewUser
      ? `${process.env.FRONTEND_URL}/setup`
      : `${process.env.FRONTEND_URL}/dashboard`;

    delete req.session.isNewUser;
    res.redirect(redirectTo);
  }
);

// GitHub OAuth routes
router.get("/github", passport.authenticate("github", { 
  scope: ["user:email"] 
}));

router.get("/github/callback",
  passport.authenticate("github", { failureRedirect: "http://localhost:5173/?error=github_auth_failed" }),
  (req, res) => {
    const redirectTo = req.session.isNewUser
      ? `${process.env.FRONTEND_URL}/setup`
      : `${process.env.FRONTEND_URL}/dashboard`;

    delete req.session.isNewUser;
    res.redirect(redirectTo);
  }
);

// LinkedIn OAuth routes
router.get("/linkedin", passport.authenticate("linkedin", {
  scope: ['r_emailaddress', 'r_liteprofile']
}));

router.get("/linkedin/callback",
  passport.authenticate("linkedin", { failureRedirect: "http://localhost:5173/?error=linkedin_auth_failed" }),
  (req, res) => {
    const redirectTo = req.session.isNewUser
      ? `${process.env.FRONTEND_URL}/setup`
      : `${process.env.FRONTEND_URL}/dashboard`;

    // Successful authentication
    delete req.session.isNewUser;
    res.redirect(redirectTo);
  }
);

module.exports = router;