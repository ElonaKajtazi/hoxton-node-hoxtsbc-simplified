import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();
const port = 4444;

app.get("/users", (req, res) => {});
app.post("/sign-up", async (req, res) => {
  const user = await prisma.user.create({
    data: {
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password),
    },
  });
  res.send(user);
});
app.post("/sign-in", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { email: req.body.email },
  });

  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    res.send(user);
  } else {
    res.status(400).send({error: "Incorrect email or pasword"})
  }
});
app.listen(port, () => {
  console.log(`App running: http://localhost:${port}/`);
});
