// Configuración Firebase (NO CAMBIAR)
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
const db = firebase.database();

// Mapbox token
mapboxgl.accessToken = 'pk.eyJ1IjoibWlndWVsLTMwIiwiYSI6ImNtbDlrcmJmcDA0YmwzZ3EwdXMwemRjZ2UifQ.FWkrX_a7mSsh4nrxcKPVwg';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [-58.53, -34.72],
    zoom: 12
});

const markers = {};
const lastHeadings = {}; // ← Para mantener último heading conocido

const vehicleColors = {
    'interno_01': '#00ff00',
    'interno_02': '#ff9900',
    'interno_03': '#0099ff',
    'interno_04': '#ff00ff',
    'interno_05': '#ffff00'
};

db.ref("lines/linea_1/vehicles").on("value", (snapshot) => {
    const busesDiv = document.getElementById("buses");
    busesDiv.innerHTML = "";

    const vehicles = snapshot.val();

    if (!vehicles) {
        busesDiv.innerHTML = "<p style='text-align:center;'>No hay colectivos activos en este momento</p>";
        return;
    }

    const sortedIds = Object.keys(vehicles).sort();

    sortedIds.forEach((id) => {
        const v = vehicles[id];

        // Lista de texto
        const div = document.createElement("div");
        div.className = "bus";
        div.style.borderLeftColor = vehicleColors[id] || '#888888';

        div.innerHTML = `
            <strong>${id.toUpperCase()}</strong><br>
            📍 Lat: ${v.lat ? v.lat.toFixed(5) : '—'}<br>
            📍 Lng: ${v.lng ? v.lng.toFixed(5) : '—'}<br>
            🚀 Velocidad: ${v.speed ? v.speed.toFixed(1) + ' km/h' : '—'}<br>
            🟢 Estado: ${v.online ? 'En línea' : 'Desconectado'}
            ${v.updated_at ? '<br><small>Última actualización: ' + new Date(v.updated_at).toLocaleTimeString() + '</small>' : ''}
        `;
        busesDiv.appendChild(div);

        // Marcador en el mapa
        const lngLat = [v.lng || -58.53, v.lat || -34.72];

        let heading = Number(v.heading);

        // Actualizar heading solo si es válido y != 0
        if (!isNaN(heading) && heading !== 0) {
            lastHeadings[id] = heading;
        }

        // Heading final: último conocido o 0
        const currentHeading = lastHeadings[id] || 0;

        if (!markers[id]) {
            const el = document.createElement('div');
            el.style.width = '60px';
            el.style.height = '60px';
            el.style.position = 'relative';
            el.style.transformOrigin = 'center center';
            el.style.transition = 'transform 0.4s ease-out';

            const img = document.createElement('img');
            img.src = 'bus.png'; // o URL pública
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            img.style.transformOrigin = 'center center';
            img.style.transition = 'transform 0.4s ease-out';
            el.appendChild(img);

            // Rotación inicial
            el.style.transform = `rotate(${currentHeading}deg)`;

            markers[id] = new mapboxgl.Marker({
                element: el,
                anchor: 'center'
            })
                .setLngLat(lngLat)
                .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
                <h3 style="margin:0; color:#000;">${id.toUpperCase()}</h3>
                <p style="margin:8px 0 0;">
                    Lat: ${v.lat ? v.lat.toFixed(5) : '—'}<br>
                    Lng: ${v.lng ? v.lng.toFixed(5) : '—'}<br>
                    Velocidad: ${v.speed ? v.speed.toFixed(1) + ' km/h' : '—'}<br>
                    Dirección: ${currentHeading.toFixed(0)}°<br>
                    Estado: ${v.online ? 'En línea' : 'Desconectado'}
                </p>
            `))
                .addTo(map);

            markers[id]._customImg = img;
        } else {
            markers[id].setLngLat(lngLat);

            const img = markers[id]._customImg;
            if (img) {
                img.style.transform = `rotate(${currentHeading}deg)`;
                console.log(`Rotando IMG de ${id} a ${currentHeading}° (último conocido)`);

                // Forzar repaint
                const el = img.parentElement;
                if (el) {
                    el.style.display = 'none';
                    el.offsetHeight;
                    el.style.display = 'block';
                }
            }
        }
    });

    // Botón centrar todos (ya lo tenés)
    document.getElementById('centerAllBtn').addEventListener('click', () => {
        if (Object.keys(markers).length === 0) return;

        const bounds = new mapboxgl.LngLatBounds();
        Object.values(markers).forEach(marker => {
            bounds.extend(marker.getLngLat());
        });

        map.fitBounds(bounds, { padding: 50, maxZoom: 16 });
    });
});