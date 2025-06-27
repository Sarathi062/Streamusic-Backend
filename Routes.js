const userRoutes = require("./routes/userRoutes.js");
const adminRoutes = require("./routes/adminRoutes.js");
const coreappRouter = require("./routes/coreappRouter.js")

const Routes = (app) => {
  app.use("/user", userRoutes);
  app.use("/admin", adminRoutes);
  app.use("/app", coreappRouter);
};

module.exports = Routes;
