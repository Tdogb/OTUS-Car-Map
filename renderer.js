var latlngarray = [];
// Define custom icons for different vehicles (you can replace these URLs with custom colored marker images)
const vehicleIcons = {
    car: L.icon({
        iconUrl: 'Suburban.png',
        iconSize: [40, 24],
        iconAnchor: [20, 12], // point of the icon which will correspond to marker's location
        popupAnchor: [1, -34], // point from which the popup should open relative to the iconAnchor
    }),
    uav: L.icon({
        iconUrl: 'Tanner1.png',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [1, -34],
    })
};

let vehicle_id_list = [];
let vehicles_dict = new Map();
let vehicleMarkers = {};

const redis = require('redis');
const client = redis.createClient();
(async () => { await client.connect()
    await client.subscribe('CarState', (message) => {
        let parsed = JSON.parse(message);
        set_from_socket(parsed.id, parsed.type, parsed);
    });
    await client.subscribe('UAVState', (message) => {
        let parsed = JSON.parse(message);
        set_from_socket(parsed.id, parsed.type, parsed);
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
addVehicleMarkers();
document.getElementById('center-button').onclick = function(){
    let bounds = L.latLngBounds(latlngarray);
    map.fitBounds(bounds);
};

// Simulate real-time updates by calling updateVehicleLocations every 2 seconds
setInterval(updateVehicleLocations, 1000);


// Example of multiple vehicles with initial GPS coordinates and assigned icons
// let vehicles = [
//     { id: 1, name: "Swiftie II", coords: [34.590165, -99.491667], alt: 0, icon: vehicleIcons.red },
//     { id: 2, name: "Tanner", coords: [34.592165, -99.491667], alt: 0, icon: vehicleIcons.blue },
//     { id: 3, name: "Lou", coords: [34.570165, -99.491667], alt: 0, icon: vehicleIcons.green }
// ];

var marked_vehicles = [];
// Function to add markers for all vehicles
function addVehicleMarkers() {
    vehicle_id_list.forEach(vehicle_id => {
        if (!marked_vehicles.includes(vehicle_id)) {
            vehicle = vehicles_dict[vehicle_id.toString()]; 
            vehicleMarkers[vehicle_id.toString()] = L.marker(vehicle.coords, { icon: vehicle.icon }).addTo(map)
            .bindPopup('<b>' + vehicle.name + '</b><br>Location: ' + vehicle.coords[0] + ', ' + vehicle.coords[1], { autoPan: true });;
            marked_vehicles.push(vehicle_id);
        }
    });
}


// Function to simulate real-time vehicle location updates
function updateVehicleLocations() {
    latlngarray = [];
    vehicle_id_list.forEach(vehicle_id => {
        vehicle = vehicles_dict[vehicle_id.toString()];
        console.log(vehicleMarkers[vehicle_id.toString()]);
        vehicleMarkers[vehicle_id.toString()].setLatLng(vehicle.coords);
        href = 'google.com/maps/place/' + toDMS(vehicle.coords[0],true) + '' + toDMS(vehicle.coords[1],true);
        vehicleMarkers[vehicle_id.toString()].bindPopup('<b>' + vehicle.name +
        '</b><br>GPS Location: ' + vehicle.coords[0].toFixed(6) + ', ' + vehicle.coords[1].toFixed(6) + 
        '<br> Altitude: ' + vehicle.alt + ' <br>' +
        '<a class="copyLink">' + href + '</a>');
        latlngarray.push(vehicleMarkers[vehicle_id].getLatLng());
    });
}

function toDMS(coordinate, isLatitude) {
    const direction = isLatitude 
        ? (coordinate >= 0 ? 'N' : 'W') 
        : (coordinate >= 0 ? 'S' : 'E');

    // Absolute value for conversion
    const absoluteValue = Math.abs(coordinate);
    const degrees = Math.floor(absoluteValue);
    const minutes = Math.floor((absoluteValue - degrees) * 60);
    const seconds = ((absoluteValue - degrees) * 60 - minutes) * 60;
    return `${degrees}°${minutes.toString().padStart(0, '0')}'${seconds.toFixed(1).padStart(0, '0')}"${direction}`;
}

function set_from_socket(id, type, parsed) {
    index = id.toString();
    if (vehicles_dict[index] != null) {
        vehicle_id_list.push(id);
        vehicles_dict[index].coords[0] = parsed.lat;
        vehicles_dict[index].coords[1] = parsed.lon;
        vehicles_dict[index].alt = parsed.alt;
    }
    else {
        if (type == 'Car') {
            vehicles_dict[index] = {name: type, coords: [parsed.lat, parsed.lon], alt: parsed.alt, icon: vehicleIcons.car }
        } else {
            vehicles_dict[index] = {name: type, coords: [parsed.lat+0.03, parsed.lon+0.03], alt: parsed.alt, icon: vehicleIcons.uav }
        }
    }
    addVehicleMarkers();
    console.log(vehicles_dict);
}