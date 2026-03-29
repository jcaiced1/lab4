import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const solarSystem = (await import("npm-solarsystem")).default;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const NASA_API_KEY =
  process.env.NASA_API_KEY || "9mUzIkhlZCZaOoMfspgZjMnwZCZ4LiRHtkgkambD";
const UNSPLASH_API_KEY =
  process.env.UNSPLASH_API_KEY ||
  "7756a1e81f817c186cf57294e1c19b37b49c54b8f34e7c499ee0ce5cd86cd16e";
const planetNames = [
  "Mercury",
  "Venus",
  "Earth",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
];

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

function getPlanetInfo(planetName) {
  const getter = solarSystem[`get${planetName}`];
  if (typeof getter !== "function") {
    return null;
  }

  return getter();
}

async function getRandomBackgroundImage() {
  const url =
    `https://api.unsplash.com/photos/random/?client_id=${UNSPLASH_API_KEY}` +
    "&featured=true&query=solar-system";

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Unsplash request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data?.urls?.full || data?.urls?.regular || "/img/solar-system-fallback.jpg";
  } catch (error) {
    return "/img/solar-system-fallback.jpg";
  }
}

app.get("/", async (req, res) => {
  const backgroundImage = await getRandomBackgroundImage();

  res.render("index", {
    title: "Solar System",
    planetNames,
    backgroundImage,
  });
});

app.get("/planet", (req, res) => {
  const planetName = req.query.planetName;
  const planetInfo = getPlanetInfo(planetName);

  if (!planetInfo) {
    return res.status(404).render("not-found", {
      title: "Planet Not Found",
      planetNames,
    });
  }

  return res.render("planet", {
    title: planetName,
    planetNames,
    planetName,
    planetInfo,
  });
});

app.get("/nasa", async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const endpoint =
    `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&date=${today}`;

  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`NASA request failed with status ${response.status}`);
    }

    const apod = await response.json();

    return res.render("nasa", {
      title: "NASA Picture of the Day",
      planetNames,
      apod,
      error: null,
    });
  } catch (error) {
    return res.status(502).render("nasa", {
      title: "NASA Picture of the Day",
      planetNames,
      apod: null,
      error: "NASA data is unavailable right now. Please try again later.",
    });
  }
});

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
