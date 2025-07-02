import nodemailer from 'nodemailer'



interface Imail {
    to: string,
    subject: string,
    html?: string,
    message?: string,
   
}


const providerEmail =process.env.EMAIL_USER
const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user:providerEmail,
        pass:process.env.EMAIL_PASS
    }
})

export const sendMail = async ({ to, subject, html, message }: Imail) => {

    if (!html || !message) {
        throw new Error("Either html contents or message must be provided")
    }
    const mailOptions = {
        from:providerEmail,
        to,
        subject,
        html,
        text:message
    }
    try {
        const info = await transport.sendMail(mailOptions)
        return info.messageId
    } catch (error) {
        console.log("Error In Nodemailer",error)
        throw error;
    }
 }
