import mongoose from "mongoose";
const connectDatabase = async () => {
    try{
        await mongoose.connect(process.env.DATABASE_URI)
        console.log("Database is successfully connected")
    }catch(error) { 
        console.log("Database connection Failed")
        process.exit(1);
    }
}

export default connectDatabase;