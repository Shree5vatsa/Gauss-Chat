import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Env } from "./env.config";
import { findByIdUserService } from "../services/user.service";

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
          const token = req.cookies?.accessToken;
          // Don't throw error here - just return null if no token
          return token || null;
        },
      ]),
      secretOrKey: Env.JWT_SECRET,
      audience: ["user"],
      // Remove algorithms or match it with your signing algorithm
      // algorithms: ["HS256"], // Default is HS256
    },
    async (payload, done) => {
      try {
        // Make sure payload has userId
        const userId = payload.userId;
        if (!userId) {
          return done(null, false);
        }
        const user = await findByIdUserService(userId);
        if (!user) {
          return done(null, false);
        }
        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    },
  ),
);

export const passportAuthenticateJwt = passport.authenticate("jwt", {
  session: false,
});
