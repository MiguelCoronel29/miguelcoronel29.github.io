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

// Cargar tu imagen personalizada como icono nativo
map.on('load', () => {
    map.loadImage('bus.png', (error, image) => {  // 'bus.png' o URL completa
        if (error) {
            console.error('Error cargando imagen de bus:', error);
            return;
        }
        map.addImage('bus-icon', image);  // nombre interno del icono
    });
});

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
        // ... dentro del sortedIds.forEach((id) => { ... })

        const lngLat = [v.lng || -58.53, v.lat || -34.72];

        let heading = Number(v.heading);
        if (!isNaN(heading) && heading !== 0) {
            lastHeadings[id] = heading;
        }
        const currentHeading = lastHeadings[id] || 0;

        if (!markers[id]) {
            markers[id] = new mapboxgl.Marker({
                // Icono personalizado nativo + rotación
                icon: 'bus-icon',          // nombre que pusimos en addImage
                rotation: currentHeading,  // rotación nativa (¡sin desfase!)
                scale: 1.0,                // tamaño (ajustá si es muy grande/pequeño)
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
        } else {
            markers[id].setLngLat(lngLat);
            markers[id].setRotation(currentHeading);  // rotación nativa
            console.log(`Rotando ${id} a ${currentHeading}° (nativo con icono)`);
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

// --- TU UBICACIÓN COMO PASAJERO ---
let myMarker = null;
let myWatchId = null;

document.getElementById('myLocationBtn').addEventListener('click', () => {
    if (myMarker) {
        // Desactivar mi ubicación
        if (myWatchId) navigator.geolocation.clearWatch(myWatchId);
        myMarker.remove();
        myMarker = null;
        myWatchId = null;
        document.getElementById('myLocationBtn').textContent = 'Mostrar mi ubicación';
        document.getElementById('myLocationBtn').style.background = '#0066ff';
        return;
    }

    if (navigator.geolocation) {
        document.getElementById('myLocationBtn').textContent = 'Obteniendo ubicación...';
        document.getElementById('myLocationBtn').style.background = '#ffaa00';

        myWatchId = navigator.geolocation.watchPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                if (!myMarker) {
                    // Crear marcador azul para tu posición
                    const el = document.createElement('div');
                    el.style.backgroundColor = '#0066ff';
                    el.style.width = '24px';
                    el.style.height = '24px';
                    el.style.borderRadius = '50%';
                    el.style.border = '3px solid white';
                    el.style.boxShadow = '0 0 10px rgba(0,102,255,0.7)';
                    el.style.position = 'relative';

                    // Pequeño círculo interno
                    const inner = document.createElement('div');
                    inner.style.width = '8px';
                    inner.style.height = '8px';
                    inner.style.backgroundColor = 'white';
                    inner.style.borderRadius = '50%';
                    inner.style.position = 'absolute';
                    inner.style.top = '50%';
                    inner.style.left = '50%';
                    inner.style.transform = 'translate(-50%, -50%)';
                    el.appendChild(inner);

                    myMarker = new mapboxgl.Marker({
                        element: el,
                        anchor: 'center'
                    })
                        .setLngLat([lng, lat])
                        .addTo(map);

                    // Centrar mapa en tu posición la primera vez
                    map.flyTo({ center: [lng, lat], zoom: 15 });
                } else {
                    myMarker.setLngLat([lng, lat]);
                }

                document.getElementById('myLocationBtn').textContent = 'Ocultar mi ubicación';
                document.getElementById('myLocationBtn').style.background = '#ff4444';
            },
            (error) => {
                console.error('Error al obtener tu ubicación:', error.message);
                alert('No se pudo obtener tu ubicación.\nVerifica permisos y GPS activado.');
                document.getElementById('myLocationBtn').textContent = 'Mostrar mi ubicación';
                document.getElementById('myLocationBtn').style.background = '#0066ff';
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    } else {
        alert('Tu navegador no soporta geolocalización.');
    }
});