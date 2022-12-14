import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();
const port = 4444;

const SECRET = process.env.SECRET!;
function getToken(id: number) {
  return jwt.sign({ id: id }, SECRET, { expiresIn: "5 minutes" });
}

async function getCurrentUser(token: string) {
  const decodedData = jwt.verify(token, SECRET);
  const user = await prisma.user.findUnique({
    //@ts-ignore
    where: { id: decodedData.id },
    include: { recieved: true, sent: true },
  });
  return user;
}

app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { recieved: true, sent: true },
    });
    res.send(users);
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ error: error.message });
  }
});
app.get("/transactions", async (req, res) => {
  try {
    //@ts-ignore
    const user = await getCurrentUser(req.headers.authorization);
    res.send(user?.recieved && user.sent);
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ error: error.message });
  }
});

app.post("/sign-up", async (req, res) => {
  try {
    const match = await prisma.user.findUnique({
      where: { email: req.body.email },
    });

    if (match) {
      res.status(400).send({ error: "This account already exists!" });
    } else {
      const user = await prisma.user.create({
        data: {
          email: req.body.email,
          password: bcrypt.hashSync(req.body.password),
        },
        include: { recieved: true, sent: true },
      });
      res.send({ user: user, token: getToken(user.id) });
    }
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ error: error.message });
  }
});
app.post("/sign-in", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.body.email },
      include: { recieved: true, sent: true },
    });

    if (user && bcrypt.compareSync(req.body.password, user.password)) {
      res.send({ user: user, token: getToken(user.id) });
    } else {
      res.status(400).send({ error: "Incorrect email or pasword" });
    }
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ error: error.message });
  }
});
app.get("/validate", async (req, res) => {
  try {
    console.log(req.headers.authorization);
    if (req.headers.authorization) {
      const user = await getCurrentUser(req.headers.authorization);
      console.log(user);
      //@ts-ignore
      res.send({ user, token: getToken(user.id) });
    } else {
      res.send({ error: "WTF IS GOING ON" });
    }
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`App running: http://localhost:${port}/`);
});
