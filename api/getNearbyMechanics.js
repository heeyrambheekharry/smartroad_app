const axios = require('axios');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { lat, lng } = req.body;
    if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
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
        return res.status(200).json({ mechanics });
    } catch (error) {
        console.error('Error fetching mechanics:', error);
        return res.status(500).json({ error: 'Failed to fetch mechanics' });
    }
}