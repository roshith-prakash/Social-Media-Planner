import { Agenda } from "agenda";
import { MongoBackend } from "@agendajs/mongo-backend";

const mongoUri = process.env.DATABASE_URL;

let agenda = null;

if (mongoUri) {
  try {
    agenda = new Agenda({
      backend: new MongoBackend({ address: mongoUri, collection: "agendaJobs" }),
      maxConcurrency: 5,
      defaultLockLifetime: 300000, // 5 minutes to accommodate video processing without unlocking
      processEvery: "15 seconds",
    });
  } catch (err) {
    console.warn("Agenda failed to configure:", err.message);
  }
} else {
  console.warn("DATABASE_URL not set; Agenda scheduler disabled in current environment.");
}

export default agenda;
