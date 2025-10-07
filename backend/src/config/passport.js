const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { OIDCStrategy } = require('passport-azure-ad');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

module.exports = function(passport) {
    const googleCallbackURL = `${process.env.API_URL}/api/auth/google/callback`;
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        googleCallbackURL
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ email: profile.emails[0].value });

            if (!user) {
                return done(null, false, { message: 'Email not registered in system' });
            }

            if (!user.googleId) {
                user.googleId = profile.id;
                await user.save();
            }

            const token = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '720h' }
            );

            return done(null, { user, token });
        } catch (err) {
            return done(err, null);
        }
    }));

    passport.use('azuread-openidconnect', new OIDCStrategy({
        identityMetadata: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0/.well-known/openid-configuration`,
        clientID: process.env.AZURE_CLIENT_ID,
        clientSecret: process.env.AZURE_CLIENT_SECRET,
        responseType: 'code id_token',
        responseMode: 'form_post',
        redirectUrl: `${process.env.API_URL}/api/auth/microsoft/callback`,
        allowHttpForRedirectUrl: true,
        validateIssuer: false,
        passReqToCallback: false,
        scope: ['profile', 'email', 'openid']
    }, async (iss, sub, profile, accessToken, refreshToken, done) => {
        try {
            let user = await User.findOne({ email: profile._json.preferred_username });

            if (!user) {
                return done(null, false, { message: 'Email not registered in system' });
            }

            if (!user.microsoftId) {
                user.microsoftId = profile.oid;
                await user.save();
            }

            const token = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '720h' }
            );

            return done(null, { user, token });
        } catch (err) {
            return done(err, null);
        }
    }));
};
