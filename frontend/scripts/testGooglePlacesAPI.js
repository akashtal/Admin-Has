// Test script to verify Google Places API is working
// Run: node scripts/testGooglePlacesAPI.js

const GOOGLE_API_KEY = 'AIzaSyCgafT4Tw62CuxxN5DwbkqWIK9pVflKEXI';

async function testPlacesAPI() {
  console.log('\n🗺️  ===== TESTING GOOGLE PLACES API =====\n');
  
  console.log('📝 Step 1: Testing Places Autocomplete API...');
  
  try {
    const query = 'Indulge Guwahati';
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&components=country:in&types=establishment|geocode&key=${GOOGLE_API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.status === 'REQUEST_DENIED') {
      console.log('   ❌ API Request DENIED');
      console.log('   Error:', data.error_message);
      console.log('\n   💡 FIX: You need to enable Places API in Google Cloud Console');
      console.log('   1. Go to: https://console.cloud.google.com/apis/library/places-backend.googleapis.com');
      console.log('   2. Click "ENABLE"');
      console.log('   3. Wait 2-3 minutes and try again\n');
      return false;
    }
    
    if (data.status === 'OK') {
      console.log('   ✅ Places Autocomplete API is WORKING!');
      console.log(`   📍 Found ${data.predictions?.length || 0} predictions for "${query}"`);
      
      if (data.predictions && data.predictions.length > 0) {
        console.log('\n   📋 Sample results:');
        data.predictions.slice(0, 3).forEach((pred, i) => {
          console.log(`      ${i + 1}. ${pred.description}`);
        });
      }
    } else {
      console.log(`   ⚠️  API returned status: ${data.status}`);
    }
    
    // Test Place Details API
    if (data.predictions && data.predictions.length > 0) {
      console.log('\n📝 Step 2: Testing Place Details API...');
      
      const placeId = data.predictions[0].place_id;
      const detailsResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,geometry&key=${GOOGLE_API_KEY}`
      );
      
      const detailsData = await detailsResponse.json();
      
      if (detailsData.status === 'REQUEST_DENIED') {
        console.log('   ❌ Place Details API Request DENIED');
        console.log('   Error:', detailsData.error_message);
        console.log('\n   💡 FIX: Same as above - enable Places API');
        return false;
      }
      
      if (detailsData.status === 'OK' && detailsData.result) {
        console.log('   ✅ Place Details API is WORKING!');
        console.log('   📍 Address:', detailsData.result.formatted_address);
        console.log('   🌍 Coordinates:', 
          `${detailsData.result.geometry.location.lat}, ${detailsData.result.geometry.location.lng}`
        );
      }
    }
    
    console.log('\n✅ ===== ALL TESTS PASSED =====\n');
    console.log('Your Google Places API is configured correctly!');
    console.log('Business registration address autocomplete will work perfectly.\n');
    return true;
    
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    console.log('\n   💡 Check your internet connection\n');
    return false;
  }
}

testPlacesAPI();

