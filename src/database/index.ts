import mongoose from 'mongoose'

export const dbConnect = async () => {
   try {
     const mongoInstace = await mongoose.connect(process.env.MONGODB_URI as string)
     console.log('MongoDb Connected Successfully on:',mongoInstace.connection.host)
   } catch (error) {
       console.log("Error In MONGODB", error)
       process.exit(1)
       
   }
}