import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });

// import dotenv from "dotenv";
// import connectDB from "./db/index.js";
// import { app } from "./app.js";

// dotenv.config({ path: "./.env" });
// connectDB()
//   .then(() => {
//     app.listen(process.env.PORT || 4000, () => {
//       console.log("listening on port " + process.env.PORT || 4000);
//     });
//     app.on("error", (err) => {
//       console.log("Error" + err);
//       throw err;
//     });
//   })
//   .catch((error) => {
//     console.log("Mongodb Failed to connect to MongoDB - " + error);
//   });
