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

// Mapbox token (asegurate de que sea el tuyo real)
mapboxgl.accessToken = 'pk.eyJ1IjoibWlndWVsLTMwIiwiYSI6ImNtbDlrcmJmcDA0YmwzZ3EwdXMwemRjZ2UifQ.FWkrX_a7mSsh4nrxcKPVwg';  // ← AQUÍ VA EL TOKEN

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [-58.53, -34.72],  // Centro aproximado Guernica
    zoom: 12
});

const markers = {};

// Colores por vehículo para distinguirlos
const vehicleColors = {
    'interno_01': '#00ff00',   // Verde
    'interno_02': '#ff9900',   // Naranja
    'interno_03': '#0099ff',   // Azul
    'interno_04': '#ff00ff',   // Magenta
    'interno_05': '#ffff00'    // Amarillo
};

// Escuchar todos los vehículos en tiempo real

db.ref("lines/linea_1/vehicles").on("value", (snapshot) => {
    const busesDiv = document.getElementById("buses");
    busesDiv.innerHTML = "";

    const vehicles = snapshot.val();

    if (!vehicles) {
        busesDiv.innerHTML = "<p style='text-align:center;'>No hay colectivos activos en este momento</p>";
        return;
    }

    // Ordenar por ID para que se vea consistente
    const sortedIds = Object.keys(vehicles).sort();

    sortedIds.forEach((id) => {
        const v = vehicles[id];

        // --- Parte 1: Lista de texto ---
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

        // --- Parte 2: Marcador en el mapa ---
        const lngLat = [v.lng || -58.53, v.lat || -34.72];

        if (!markers[id]) {
            // Crear el div personalizado con la imagen
            const el = document.createElement('div');
            el.style.backgroundImage = `url('bus.png')`;  // o tu archivo local
            el.style.backgroundSize = 'contain';
            el.style.width = '48px';
            el.style.height = '48px';
            el.style.backgroundRepeat = 'no-repeat';
            el.style.backgroundPosition = 'center';
            el.style.transformOrigin = 'center center';  // importante: rota desde el centro
            el.style.transition = 'transform 0.3s ease'; // suave al rotar

            // Aplicar rotación inicial
            const initialHeading = v.heading || 0;
            el.style.transform = `rotate(${initialHeading}deg)`;

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
            Dirección: ${initialHeading}°<br>
            Estado: ${v.online ? 'En línea' : 'Desconectado'}
        </p>
    `))
                .addTo(map);

            // Guardar referencia al div de la imagen (para rotarlo después)
            markers[id].customElement = el;
        } else {
            // Mover posición
            markers[id].setLngLat(lngLat);

            // Rotar el ícono usando la referencia guardada
            const el = markers[id].customElement;
            if (el) {
                const heading = v.heading || 0;
                el.style.transform = `rotate(${heading}deg)`;
            }
        }
    });

    document.getElementById('centerAllBtn').addEventListener('click', () => {
        if (Object.keys(markers).length === 0) return;

        const bounds = new mapboxgl.LngLatBounds();
        Object.values(markers).forEach(marker => {
            bounds.extend(marker.getLngLat());
        });

        map.fitBounds(bounds, { padding: 50, maxZoom: 16 });
    });

    // Centrar mapa en el primer vehículo activo (opcional)
    /*
    if (sortedIds.length > 0) {
        const firstVehicle = vehicles[sortedIds[0]];
        if (firstVehicle.lat && firstVehicle.lng) {
            map.flyTo({
                center: [firstVehicle.lng, firstVehicle.lat],
                zoom: 14,
                essential: true
            });
        }
    }*/
});