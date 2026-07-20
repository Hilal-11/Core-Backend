import express from "express" 
import dotenv from "dotenv" 
import morgan from "morgan";
import cors from "cors"
dotenv.config({
    path: './.env'
});
import connectDatabase from "./database/connect-database.js"
import connectCloudinary from "./database/connect-cloudinary.js";
import authRouter from "./routes/auth.routes.js";
import noteRouter from "./routes/note.routes.js";
import cookieParser from "cookie-parser";
import labelRouter from "./routes/label.routes.js"
import startTrashPurgeCron from "./utils/purgeTrash.js";
import errorHandler from "./utils/errorHandler.js";

const PORT = process.env.PORT || 3001
const app = express();

const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
    optionsSuccessStatus: 200,
    credentials: true,
}
app.use(cors(corsOptions))

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/auth", authRouter)
app.use("/api/v1/notes", noteRouter)
app.use("/api/v1/labels", labelRouter)
app.use(morgan('dev')) // logging the whole app (logs)

app.get("/", (req , res) => {
    return res.status(200).json({
        status: 200,
        success: true,
        message: "app is running successfully"
    })
})

app.use(errorHandler); // global error handler (Graceful crash the app if there is some error)

connectDatabase()
connectCloudinary()
startTrashPurgeCron() // corn-jobs to delete perminently trashed notes after 30-days

app.listen(PORT , () => {
    console.log(`App is runnign at PORT: ${PORT}`)
})