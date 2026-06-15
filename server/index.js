import express from "express"
import dotenv from "dotenv"
import { connect } from "mongoose"
import connectDb from "./config/db.js"
import authRouter from "./routes/auth.routes.js"
import cors from "cors"
import cookieParser from "cookie-parser"
import userRouter from "./routes/user.route.js"
import interviewRouter from "./routes/interview.route.js"
import paymentRouter from "./routes/payment.route.js"
dotenv.config()
const app=express()

app.use(cors({
    origin:"http://localhost:5173",
    credentials:true,
    
}))
app.use(express.json())
app.use(cookieParser())


const PORT=process.env.PORT || 6000
app.use("/api/auth",authRouter)
app.use("/api/user",userRouter)
app.use("/api/interview",interviewRouter)
app.use("/api/payment",paymentRouter)

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
    connectDb()
})