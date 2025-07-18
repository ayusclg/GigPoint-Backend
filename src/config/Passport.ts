import { Request } from "express";
import passport from "passport";
import { Strategy,Profile,VerifyCallback } from "passport-google-oauth20";
import { User } from "../models/userModel";
import path from 'path'
import fs from 'fs'
import { sendMail } from "../services/Nodemailer"

const welcomeUser = path.join(__dirname, '../templates/welcomeUser.html')
const welcome = fs.readFileSync(welcomeUser, "utf-8")

passport.use(new Strategy
    ({
        clientID: process.env.CLIENT_ID || "",
      clientSecret: process.env.CLIENT_SECRET || "",
      callbackURL: "http://localhost:3000/api/v1/oauth/google/callback",
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
                    role:"user",
                    gender:"male"
                })
                console.log(profile.displayName)
                 const welcomeHtml = welcome.replace(
                   "{{username}}",
                   user.fullName.split(" ")[0]
                 );
                 const response = {
                   to: user.email,
                   subject: "Welcome To Gigpoint",
                   html: welcomeHtml,
                   message: "under dev soon prod",
                 };
                 await sendMail(response);
    
                
            }
                return done(null,user)
        } catch (error) {
            return done(error)
        }
        }
        ))