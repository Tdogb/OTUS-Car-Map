const redis = require('redis');
const client = redis.createClient();
(async () => { await client.connect()
// Subscribe to a channel
console.log("Subscribed to 'my-channel'");
await client.subscribe('my-channel', (message) => {
    console.log(message); // 'message'
});
})();

const map = L.map('map').setView([34.580165, -99.491667], 13);

// Set up the tile layer (this is the background map; here we use OpenStreetMap tiles).
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
 // Replace this with your own Mapbox API key
// const accessToken = 'your_mapbox_api_key_here';

// // Initialize the map and set its view to the desired location
// const map = L.map('map').setView([37.7749, -122.4194], 13); // Centered on San Francisco

// // Use Mapbox's satellite tiles
// L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}@2x?access_token=${accessToken}`, {
//     attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a> contributors',
//     maxZoom: 19
// }).addTo(map);

// Define custom icons for different vehicles (you can replace these URLs with custom colored marker images)
const vehicleIcons = {
    red: L.icon({
        iconUrl: 'Tanner1.png',
        iconSize: [41, 41], // size of the icon
        iconAnchor: [12, 41], // point of the icon which will correspond to marker's location
        popupAnchor: [1, -34], // point from which the popup should open relative to the iconAnchor
    }),
    blue: L.icon({
        iconUrl: 'Lou1.jpg',
        iconSize: [41, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
    }),
    green: L.icon({
        iconUrl: 'Suburban.png',
        iconSize: [41, 25],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
    })
};

// Example of multiple vehicles with initial GPS coordinates and assigned icons
let vehicles = [
    { id: 1, name: "Tanner", coords: [34.590165, -99.491667], icon: vehicleIcons.red },
    { id: 2, name: "Lou", coords: [34.592165, -99.491667], icon: vehicleIcons.blue },
    { id: 3, name: "Swiftie II", coords: [34.570165, -99.491667], icon: vehicleIcons.green }
];

// Create a dictionary to store markers for each vehicle
let vehicleMarkers = {};

// Function to add markers for all vehicles
function addVehicleMarkers() {
    vehicles.forEach(vehicle => {
        let marker = L.marker(vehicle.coords, { icon: vehicle.icon }).addTo(map)
            .bindPopup('<b>' + vehicle.name + '</b><br>Location: ' + vehicle.coords[0] + ', ' + vehicle.coords[1], { autoPan: false });

        // Store the marker reference in the vehicleMarkers dictionary
        vehicleMarkers[vehicle.id] = marker;
    });
}

// Call the function to add markers for all vehicles
addVehicleMarkers();

// Function to simulate real-time vehicle location updates
function updateVehicleLocations() {
    vehicles.forEach(vehicle => {
        // Simulating movement by slightly changing the latitude and longitude
        vehicle.coords[0] += (Math.random() - 0.5) * 0.001;  // Slight change in latitude
        vehicle.coords[1] += (Math.random() - 0.5) * 0.001;  // Slight change in longitude

        // Update the marker for this vehicle
        vehicleMarkers[vehicle.id].setLatLng(vehicle.coords);
        vehicleMarkers[vehicle.id].bindPopup('<b>' + vehicle.name + '</b><br>GPS Location: ' + vehicle.coords[0].toFixed(6) + ', ' + vehicle.coords[1].toFixed(6) + '<br> Altitude: 15');
            // .openPopup();
    });
}

function set_from_socket(index,lat,lon,alt,speed_2d,speed_3d) {
    vehicles[index].coords[0] = lat;
    vehicles[index].coords[1] = lon;
}

// Simulate real-time updates by calling updateVehicleLocations every 2 seconds
setInterval(updateVehicleLocations, 200);