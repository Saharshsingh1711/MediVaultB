const { algoliasearch } = require("algoliasearch");
require("dotenv").config();

async function test() {
  try {
    const client = algoliasearch(
      process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
      process.env.ALGOLIA_WRITE_API_KEY
    );
    console.log("App ID:", process.env.NEXT_PUBLIC_ALGOLIA_APP_ID);
    console.log("Key prefix:", process.env.ALGOLIA_WRITE_API_KEY?.substring(0, 4) + "...");
    
    // Attempt to list indices as a simple check
    const indices = await client.listIndices();
    console.log("Success! Indices:", indices);
  } catch (err) {
    console.error("Algolia Test Failed:", err.message);
  }
}

test();
