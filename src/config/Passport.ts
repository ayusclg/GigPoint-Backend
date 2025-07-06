import { Request } from "express";
import passport from "passport";
import { Strategy,Profile,VerifyCallback } from "passport-google-oauth20";
import { User } from "../models/userModel";


passport.use(new Strategy
    ({
        clientID: process.env.CLIENT_ID || "",
      clientSecret: process.env.CLIENT_SECRET || "",
      callbackURL: "http://localhost:3000/auth/google/callback",
      passReqToCallback: true,
},
        async (
            req: Request,
             accessToken: string,
            refreshToken: string,
            profile: Profile,
            done: VerifyCallback,
        ) => {
        try {
            let user = await User.findOne({
                googleId:profile.id
            })
            
            if (!user) {
                user = await User.create({
                    googleId:profile.id,
                    fullName: profile.displayName,
                    email: profile.emails?.[0]?.value || "",
                    profilePicture: profile.photos?.[0]?.value || "",
                    role:"user"
                })
                
            }
                return done(null,user)
        } catch (error) {
            return done(error)
        }
        }
        ))