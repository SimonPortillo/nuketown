export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Parse query parameters
  const { district, municipality } = req.query;
  
  try {
    const baseUrl = "https://api.politiet.no/politiloggen/v1/messages";
    const params = new URLSearchParams();
    if (district) params.append("Districts", district);
    if (municipality) params.append("Municipalities", municipality);
    
    const url = `${baseUrl}${params.toString() ? `?${params.toString()}` : ''}`;
    
    console.log("Serverless function fetching from:", url);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Police API error:", error);
    return res.status(500).json({ 
      error: "Failed to fetch police data",
      message: error.message
    });
  }
}
