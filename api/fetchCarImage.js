const axios = require('axios');

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { make, model, year } = req.body;
    if (!make || !model) {
        return res.status(400).json({ error: 'Make and model are required' });
    }

    try {
        const searchQuery = `${make} ${model} ${year || ''}`.trim();
        const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchQuery)}&gsrlimit=1&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json`;
        
        const response = await axios.get(wikiUrl);
        const pages = response.data.query && response.data.query.pages;
        
        if (pages) {
            const pageId = Object.keys(pages)[0];
            const imageInfo = pages[pageId].imageinfo;
            if (imageInfo && imageInfo[0]) {
                const imageUrl = imageInfo[0].thumburl || imageInfo[0].url;
                if (imageUrl) {
                    return res.status(200).json({ imageUrl });
                }
            }
        }
        return res.status(200).json({ imageUrl: null, message: 'No image found' });
    } catch (error) {
        console.error('Error fetching car image:', error);
        return res.status(500).json({ error: 'Failed to fetch image' });
    }
}