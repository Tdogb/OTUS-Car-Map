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

var terrainLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://opentopomap.org/copyright">OpenTopoMap</a>'
});

// Set up the tile layer (this is the background map; here we use OpenStreetMap tiles).
var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

var OpenTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

var Stadia_AlidadeSatellite = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}', {
	minZoom: 0,
	maxZoom: 20,
	attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'jpg'
});

var elevationLayer = L.tileLayer.wms(
    'https://elevation.nationalmap.gov/arcgis/services/3DEPElevation/ImageServer/WMSServer?',{
        layers: '3DEPElevation:Hillshade Gray',
        className: 'lidarBase',
});

elevationLayer.on('tileload', function(event) {
    console.log("tile loaddd");
    console.log(event);
    var tile = event.tile;
    var ctx = tile.getContext('2d');
    var imageData = ctx.getImageData(0, 0, tile.width, tile.height);
    
    for (var i = 0; i < imageData.data.length; i += 4) {
        var elevationValue = imageData.data[i]; // Assume grayscale elevation
        var color = getColor(elevationValue);
        var rgb = L.color(color).rgb();
        imageData.data[i] = rgb.r;
        imageData.data[i + 1] = rgb.g;
        imageData.data[i + 2] = rgb.b;
    }

    ctx.putImageData(imageData, 0, 0);
});

function getColor(d) {
    return d > 3000 ? '#008000' : // Green for high elevations
           d > 1000 ? '#FFFF00' : // Yellow for mid elevations
           d > 0 ? '#FF0000' :    // Red for low elevations
                    '#FFFFFF';      // White for no data
}

// Function to switch between layers
var baseLayers = {
    "OpenStreetMap": osmLayer,
    "Terrain Map": OpenTopoMap,
    "Stadia Satellite": Stadia_AlidadeSatellite,
    "Satellite": Esri_WorldImagery,
    "LIDAR": elevationLayer
};

// Add layer control
L.control.layers(baseLayers).addTo(map);




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
            // if (vehicle_id.coords[0] < 52 && vehicle_id.coords[0] > 12 && vehicle_id.coords[1] > -128 && vehicle_id.coords[1] < -67){
                vehicle = vehicles_dict[vehicle_id.toString()]; 
                vehicleMarkers[vehicle_id.toString()] = L.marker(vehicle.coords, { icon: vehicle.icon }).addTo(map)
                .bindPopup('<b>' + vehicle.name + '</b><br>Location: ' + vehicle.coords[0] + ', ' + vehicle.coords[1], { autoPan: true });;
                marked_vehicles.push(vehicle_id);
            // }
        }
    });
}


// Function to simulate real-time vehicle location updates
function updateVehicleLocations() {
    latlngarray = [];
    vehicle_id_list.forEach(vehicle_id => {
        // if (vehicle_id.coords[0] < 52 && vehicle_id.coords[0] > 12 && vehicle_id.coords[1] > -128 && vehicle_id.coords[1] < -67){
            vehicle = vehicles_dict[vehicle_id.toString()];
            console.log(vehicleMarkers[vehicle_id.toString()]);
            vehicleMarkers[vehicle_id.toString()].setLatLng(vehicle.coords);
            href = 'google.com/maps/place/' + toDMS(vehicle.coords[0],true) + '' + toDMS(vehicle.coords[1],true);
            vehicleMarkers[vehicle_id.toString()].bindPopup('<b>' + vehicle.name +
            '</b><br>GPS Location: ' + vehicle.coords[0].toFixed(6) + ', ' + vehicle.coords[1].toFixed(6) + 
            '<br> Altitude: ' + vehicle.alt + ' <br>' +
            '<a class="copyLink">' + href + '</a>');
            latlngarray.push(vehicleMarkers[vehicle_id].getLatLng());
        // }
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