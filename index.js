const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(express.static("build"));
app.use(cors());
app.use(morgan("tiny"));

const Person = require("./models/person");

morgan.token("reqBody", (request, response) => {
  return JSON.stringify(request.body);
});

app.get("/info", (request, response, next) => {
  Person.count()
    .then((result) =>
      response
        .status(200)
        .send(`<p>Phone has info for ${result} people</p><p>${new Date()}</p>`)
        .end()
    )
    .catch((error) => next(error));
});

app.get("/api/persons", (request, response, error) => {
  Person.find({})
    .then((persons) => response.json(persons).end())
    .catch((error) => next(error));
});

// Prefer to just return the response code over additional branching
app.get("/api/persons/:id", (request, response, next) => {
  Person.findById(request.params.id)
    .then((result) => {
      if (!result) return response.status(404).end();
      response.json(result).end();
    })
    .catch((error) => next(error));
});

app.put("/api/persons/:id", (request, response, next) => {
  const { name, number, id } = request.body;
  Person.findByIdAndUpdate(id, { name, number })
    .then((result) => {
      if (!result) return response.status(404).end();
      response.status(200).end();
    })
    .catch((error) => next(error));
});

// Better to just return 204 a
app.delete("/api/persons/:id", (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then((result) => {
      if (!result) return response.status(404).end();
      response.status(204).end();
    })
    .catch((error) => next(error));
});

app.post(
  "/api/persons",
  morgan(
    ":method :url :status :res[content-length] - :response-time ms :reqBody"
  ),
  (request, response, error) => {
    const { name, number } = request.body;

    if (!name || !number) {
      return response.status(400).end();
    }

    const person = new Person({
      name,
      number,
    });

    Person.findOne({ name }).then((result) => {
      if (result) return response.status(409).end();
      person
        .save()
        .then((savedPerson) => {
          response.json(savedPerson);
        })
        .catch((error) => next(error));
    });
  }
);

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

const errorHandler = (error, request, response, next) => {
  // console.log(error);
  if (error.name === "CastError")
    return response.status(400).send({ error: "malformatted id" }).end();
  response.status(500).end();
};

app.use(unknownEndpoint);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
