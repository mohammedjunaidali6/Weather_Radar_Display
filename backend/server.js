const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

const MRMS_BASE_URL = 'https://mrms.ncep.noaa.gov/data/2D/ReflectivityAtLowestAltitude/';

app.get('/api/radar/latest', async (req, res) => {
  try {
    // Fetch the directory listing
    const response = await axios.get(MRMS_BASE_URL, {
      responseType: 'text'
    });
    
    // Parse HTML to find the latest RALA file
    const html = response.data;
    const gribMatches = html.match(/MRMS_ReflectivityAtLowestAltitude_\d{8}-\d{6}\.grib2\.gz/g);
    
    if (!gribMatches || gribMatches.length === 0) {
      return res.status(404).json({ error: 'No radar data files found' });
    }
    
    // Get the most recent file
    const latestFile = gribMatches[gribMatches.length - 1];
    const fileUrl = `${MRMS_BASE_URL}${latestFile}`;
    
    // Fetch the actual GRIB2 file
    const fileResponse = await axios.get(fileUrl, {
      responseType: 'arraybuffer'
    });
    
    res.json({
      filename: latestFile,
      timestamp: latestFile.match(/\d{8}-\d{6}/)[0],
      data: Buffer.from(fileResponse.data).toString('base64'),
      size: fileResponse.data.length
    });
  } catch (error) {
    console.error('Error fetching MRMS data:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch radar data',
      details: error.message 
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'MRMS Radar Proxy' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`MRMS Radar Proxy running on port ${PORT}`);
});
