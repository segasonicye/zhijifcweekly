const axios = require('axios');

async function search() {
  try {
    const response = await axios.post('https://api.tavily.com/search', {
      api_key: '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',
      query: 'football match results yesterday February 13 2026 major leagues scores',
      search_depth: 'basic',
      include_answer: true
    });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error(error.message);
    if (error.response) console.error(error.response.data);
  }
}

search();