const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const axios = require("axios");

// Set max instances for cost control
setGlobalOptions({ maxInstances: 10 });

/**
 * Function 1: Fetch Real Car Image
 */
exports.fetchCarImage = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "GET, POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).send("");
    return;
  }

  const { make, model, year } = req.body;
  if (!make || !model) {
    res.status(400).json({ error: "Make and model are required" });
    return;
  }

  try {
    const searchQuery = `${make} ${model} ${year || ""}`.trim();
    const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchQuery)}&gsrlimit=1&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json`;
    
    const response = await axios.get(wikiUrl);
    const pages = response.data.query && response.data.query.pages;
    
    if (pages) {
      const pageId = Object.keys(pages)[0];
      const imageInfo = pages[pageId].imageinfo;
      
      if (imageInfo && imageInfo[0]) {
        // Fixed the optional chaining syntax here
        const imageUrl = imageInfo[0].thumburl || imageInfo[0].url;
        if (imageUrl) {
          res.status(200).json({ imageUrl });
          return;
        }
      }
    }
    
    res.status(200).json({ imageUrl: null, message: "No image found" });
  } catch (error) {
    logger.error("Error fetching car image", error);
    res.status(500).json({ error: "Failed to fetch image" });
  }
});

/**
 * Function 2: Fetch Nearby Mechanics
 */
exports.getNearbyMechanics = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "GET, POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).send("");
    return;
  }

  const { lat, lng } = req.body;
  if (!lat || !lng) {
    res.status(400).json({ error: "Latitude and longitude are required" });
    return;
  }

  try {
    const query = `
      [out:json];
      node
        ["shop"="car_repair"]
        (around:5000, ${lat}, ${lng});
      out;
    `;
    
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const response = await axios.get(overpassUrl);
    const mechanics = response.data.elements.map(el => ({
      name: el.tags.name || "Local Auto Shop",
      phone: el.tags.phone || "N/A",
      lat: el.lat,
      lng: el.lon,
    }));

    res.status(200).json({ mechanics });
  } catch (error) {
    logger.error("Error fetching mechanics", error);
    res.status(500).json({ error: "Failed to fetch mechanics" });
  }
});