require("dotenv").config();
const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

const url = process.env.MONGODB_URI;

// ESLint doesn't like .then(result) if the parameter is unused
mongoose
  .connect(url)
  .then(() => {
    console.log("connected to mongoDB");
  })
  .catch((error) => {
    console.log("error connecting to MongoDB:", error.message);
  });

const numberValidator = (v) => {
  return /^\d{2,3}-\d+$/.test(v);
};

const personSchema = new mongoose.Schema({
  name: { type: String, minLength: 3, required: true },
  number: {
    type: String,
    minLength: 8,
    required: true,
    validate: {
      validator: (v) => numberValidator(v),
      message: (props) => `${props.value} is not a valid phone number!`,
    },
  },
});

personSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

process.on("SIGINT", () => {
  mongoose.connection
    .close()
    .then(() => {
      console.log("Mongoose connection closed");
      process.exit();
    })
    .catch((error) => {
      console.log("issue when closing mongoose connection", error);
      process.exit();
    });
});

module.exports = mongoose.model("Person", personSchema);
