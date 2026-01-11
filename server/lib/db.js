import mongoose from 'mongoose';

//function to connect to the mongoDB Database
export const connectDB = async ()=>{
    try{
     
        mongoose.connection.on('connected', ()=> console.log
        ('database connected'));
        
         mongoose.connection.on('error', (err)=>{
            console.log("MongoDB connection error:", err)
         }) 

        await mongoose.connect(`${process.env.MONGODB_URI}/chat-app`)
    }catch(error){
    console.log(error)
    }
}