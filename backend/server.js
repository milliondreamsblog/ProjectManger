const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const managerRoutes = require("./routes/managerRoutes");
const cron = require("node-cron");
const socketIo = require("socket.io");
const http = require("http");
const path = require('path');
const passport = require('passport');
const clientRoutes = require("./routes/zoho");
const  zohoRoutes =require("./routes/zoho");  
dotenv.config();


const app = express();
const server = http.createServer(app); 

// const io = socketIo(server, {
//   cors: {
//     origin: "http://localhost:5173",  
//     methods: ["GET", "POST"],
//     allowedHeaders: ["Content-Type"],
//     credentials: true,
//   },
// });
   
// module.exports = { io };



// Allowed CORS origins. Local dev defaults are always allowed; additional
// origins (e.g. your deployed frontend) come from the CORS_ORIGINS env var as
// a comma-separated list. FRONTEND_URL is also allowed automatically.
const defaultOrigins = [
	"http://localhost:5173",
	"http://localhost:5174",
];

const envOrigins = (process.env.CORS_ORIGINS || "")
	.split(",")
	.map((o) => o.trim())
	.filter(Boolean);

const allowedOrigins = [
	...defaultOrigins,
	...envOrigins,
	...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests w/o origin (like mobile apps, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn('❌ CORS blocked for origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With','Accept'],
  credentials: true,   // ← if you ever need to send cookies
  maxAge: 86400
};

app.use((req, res, next) => {
  console.log('➡️ Incoming', req.method, req.originalUrl, 'from', req.headers.origin);
  next();
});
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(passport.initialize());   
 
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/role-config", require("./routes/roleConfigRoutes"));
app.use("/api/project", require("./routes/projectRoutes"));
app.use('/api/templates', require('./routes/templateRoutes'));
app.use("/api/task", require("./routes/taskRoutes"));
app.use("/api/clientName", require("./routes/clientName"));
app.use("/api/comment", require("./routes/commentRoutes"));
app.use("/api/audit", require("./routes/auditRoute"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/calendar", require("./routes/calendarRoutes"));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/api/zoho", zohoRoutes);
// require("./cron/notificationCron");

// io.on("connection", (socket) => {
//   console.log("New client connected");
//   socket.on("disconnect", () => {
//     console.log("Client disconnected");
//   });
// });


 
app.get('/hello', (req,res)=>{
    console.log('hello world');
    res.json({data: 'welcome to SGC Backend....'});
}) 
   
const PORT = process.env.PORT || 5001;
   
 
connectDB()
  .then(() => {
    console.log("Database Connection established...");
    server.listen(PORT, (req, res) => {
      console.log(`Server runningg on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Database is not connected");
  });
