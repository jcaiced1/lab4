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
const NASA_FALLBACK_KEY = "DEMO_KEY";
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
const planetImages = {
  Mercury: "https://images-assets.nasa.gov/image/PIA16853/PIA16853~orig.jpg",
  Venus: "https://images-assets.nasa.gov/image/PIA23791/PIA23791~orig.jpg",
  Earth: "https://images-assets.nasa.gov/image/PIA18033/PIA18033~orig.jpg",
  Mars: "https://images-assets.nasa.gov/image/PIA00407/PIA00407~orig.jpg",
  Jupiter: "https://images-assets.nasa.gov/image/PIA02873/PIA02873~orig.jpg",
  Saturn: "https://images-assets.nasa.gov/image/PIA11141/PIA11141~orig.jpg",
  Uranus: "https://images-assets.nasa.gov/image/PIA18182/PIA18182~orig.jpg",
  Neptune: "https://images-assets.nasa.gov/image/PIA01492/PIA01492~orig.jpg",
};

app.locals.courseName = "CST336 Internet Programming";
app.locals.studentName = "Jose Caicedo";
app.locals.schoolName = "California State University, Monterey Bay";
app.locals.currentYear = new Date().getFullYear();

function getPlanetCards() {
  return planetNames.map((planetName) => ({
    name: planetName,
    image: planetImages[planetName] || "/img/solar-system-fallback.svg",
  }));
}

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
    "&featured=true&orientation=landscape&query=outer-space-planets-solar-system";

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Unsplash request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data?.urls?.full || data?.urls?.regular || "/img/solar-system-fallback.svg";
  } catch (error) {
    return "/img/solar-system-fallback.svg";
  }
}

async function fetchApod(date, apiKey) {
  const endpoint = new URL("https://api.nasa.gov/planetary/apod");
  endpoint.searchParams.set("api_key", apiKey);

  if (date) {
    endpoint.searchParams.set("date", date);
  }

  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`NASA APOD request failed with status ${response.status}`);
  }

  return response.json();
}

async function getApod(date) {
  const apiKeys = [NASA_API_KEY, NASA_FALLBACK_KEY];
  const requestDates = date ? [date, null] : [null];

  for (const apiKey of apiKeys) {
    for (const requestDate of requestDates) {
      try {
        return await fetchApod(requestDate, apiKey);
      } catch (error) {
        continue;
      }
    }
  }

  throw new Error("NASA APOD request failed for all configured API keys.");
}

app.get("/", async (req, res) => {
  const backgroundImage = await getRandomBackgroundImage();
  let homeApod = null;

  try {
    homeApod = await getApod();
  } catch (error) {
    homeApod = null;
  }

  res.render("index", {
    title: "Solar System",
    planetNames,
    planets: getPlanetCards(),
    backgroundImage,
    homeApod,
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

  const normalizedPlanetInfo = {
    ...planetInfo,
    image: planetImages[planetName] || planetInfo.image || "/img/solar-system-fallback.svg",
  };

  return res.render("planet", {
    title: planetName,
    planetNames,
    planetName,
    planetInfo: normalizedPlanetInfo,
  });
});

app.get("/nasa", async (req, res) => {
  try {
    const apod = await getApod();

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
