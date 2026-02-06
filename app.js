// Configuración Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBLQTF45rPS0zUUNchDJ5DagygX8nojMxE",
    authDomain: "colectivos-tiempo-real.firebaseapp.com",
    databaseURL: "https://colectivos-tiempo-real-default-rtdb.firebaseio.com",
    projectId: "colectivos-tiempo-real",
    storageBucket: "colectivos-tiempo-real.firebasestorage.app",
    messagingSenderId: "454978508967",
    appId: "1:454978508967:web:be55f535a0504029b5e382"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Realtime Database
const db = firebase.database();

// Mapbox
mapboxgl.accessToken = 'pk.eyJ1IjoibWlndWVsLTMwIiwiYSI6ImNtbDlrcmJmcDA0YmwzZ3EwdXMwemRjZ2UifQ.FWkrX_a7mSsh4nrxcKPVwg';  // ← AQUÍ VA EL TOKEN

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [-58.38, -34.60],
    zoom: 12
});

const markers = {};

const busesDiv = document.getElementById("buses");

// Escuchar vehículos en tiempo real
db.ref("lines/linea_1/vehicles").on("value", (snapshot) => {
    busesDiv.innerHTML = "";

    const vehicles = snapshot.val();

    if (!vehicles) {
        busesDiv.innerHTML = "No hay colectivos activos";
        return;
    }

    Object.keys(vehicles).forEach((id) => {
        const v = vehicles[id];

        // Info en texto
        const div = document.createElement("div");
        div.className = "bus";
        div.innerHTML = `
            <b>Vehículo:</b> ${id}<br>
            📍 Lat: ${v.lat}<br>
            📍 Lng: ${v.lng}<br>
            🚀 Velocidad: ${v.speed || '—'}<br>
            🟢 Online: ${v.online ? 'Sí' : 'No'}
        `;
        busesDiv.appendChild(div);

        // Marcador en mapa
        const lngLat = [v.lng, v.lat];

        if (!markers[id]) {
            markers[id] = new mapboxgl.Marker({ color: '#00ff00' })
                .setLngLat(lngLat)
                .setPopup(new mapboxgl.Popup().setHTML(`
                    <h3>Colectivo ${id}</h3>
                    <p>Lat: ${v.lat}<br>Lng: ${v.lng}<br>Velocidad: ${v.speed || '—'}</p>
                `))
                .addTo(map);
        } else {
            markers[id].setLngLat(lngLat);
        }

        // Centrar en el primero
        if (Object.keys(markers).length === 1) {
            map.setCenter(lngLat);
        }
    });
});