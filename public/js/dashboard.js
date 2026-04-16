// ── VERIFICAR SESIÓN ─────────────────────────────────────
async function verificarSesion() {
    try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
            window.location.href = '/';
            return null;
        }
        const data = await res.json();
        return data.usuario;
    } catch (error) {
        window.location.href = '/';
        return null;
    }
}

// ── DETERMINAR ESTADO DEL SUELO ──────────────────────────
function obtenerEstado(humedad) {
    if (humedad === null || humedad === undefined) return { texto: '--',     color: '#94a3b8' };
    if (humedad < 20)  return { texto: '🔴 Seco',     color: '#dc2626' };
    if (humedad < 40)  return { texto: '🟡 Bajo',     color: '#d97706' };
    if (humedad < 70)  return { texto: '🟢 Óptimo',   color: '#16a34a' };
    return               { texto: '🔵 Saturado', color: '#2563a8' };
}

// ── FORMATEAR FECHA ──────────────────────────────────────
function formatearFecha(fechaStr) {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleString('es-CO', {
        day:    '2-digit',
        month:  '2-digit',
        year:   'numeric',
        hour:   '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// ── ACTUALIZAR MÉTRICAS ──────────────────────────────────
function actualizarMetricas(ultima, promedio) {
    // Humedad actual
    const humedad = ultima ? ultima.humedad : null;
    document.getElementById('humedad-actual').textContent =
        humedad !== null ? `${humedad}%` : '--';

    // Promedio del día
    document.getElementById('humedad-promedio').textContent =
        promedio !== null ? `${promedio}%` : '--';

    // Estado del suelo
    const estado = obtenerEstado(humedad);
    const estadoEl = document.getElementById('estado-suelo');
    estadoEl.textContent  = estado.texto;
    estadoEl.style.color  = estado.color;

    // Última actualización
    document.getElementById('ultima-hora').textContent =
        ultima ? formatearFecha(ultima.registrado_en) : '--';
}

// ── DIBUJAR GRÁFICO DE LÍNEA ─────────────────────────────
function dibujarGraficoLinea(lecturas) {
    // Invertimos para mostrar del más antiguo al más reciente
    const datos = [...lecturas].reverse();

    const x = datos.map(l => new Date(l.registrado_en));
    const y = datos.map(l => l.humedad);

    const trace = {
        x, y,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Humedad (%)',
        line:   { color: '#2563a8', width: 2 },
        marker: { color: '#2563a8', size: 5 }
    };

    const layout = {
        margin:     { t: 10, r: 20, b: 50, l: 50 },
        xaxis:      { title: 'Hora', gridcolor: '#e2e8f0' },
        yaxis:      { title: 'Humedad (%)', range: [0, 100], gridcolor: '#e2e8f0' },
        paper_bgcolor: 'transparent',
        plot_bgcolor:  'transparent',
        font:       { family: 'Inter, system-ui, sans-serif', size: 12 }
    };

    Plotly.newPlot('grafico-linea', [trace], layout, { responsive: true });
}

// ── DIBUJAR GAUGE ────────────────────────────────────────
function dibujarGauge(humedad) {
    const valor = humedad !== null ? humedad : 0;

    const data = [{
        type: 'indicator',
        mode: 'gauge+number',
        value: valor,
        number: { suffix: '%', font: { size: 28 } },
        gauge: {
            axis:  { range: [0, 100], tickwidth: 1, tickcolor: '#475569' },
            bar:   { color: '#2563a8' },
            steps: [
                { range: [0,  20], color: '#fecaca' },
                { range: [20, 40], color: '#fde68a' },
                { range: [40, 70], color: '#bbf7d0' },
                { range: [70, 100], color: '#bfdbfe' }
            ],
            threshold: {
                line:  { color: '#1c2b3a', width: 3 },
                thickness: 0.75,
                value: valor
            }
        }
    }];

    const layout = {
        margin:        { t: 20, r: 20, b: 20, l: 20 },
        paper_bgcolor: 'transparent',
        font:          { family: 'Inter, system-ui, sans-serif' }
    };

    Plotly.newPlot('grafico-gauge', data, layout, { responsive: true });
}

// ── ACTUALIZAR TABLA ─────────────────────────────────────
function actualizarTabla(lecturas) {
    const tbody = document.getElementById('tabla-body');

    if (lecturas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="tabla-vacia">No hay lecturas registradas aún</td></tr>';
        return;
    }

    tbody.innerHTML = lecturas.map(l => {
        const estado = obtenerEstado(l.humedad);
        return `
      <tr>
        <td>${formatearFecha(l.registrado_en)}</td>
        <td>${l.sensor_id}</td>
        <td><strong>${l.humedad}%</strong></td>
        <td style="color: ${estado.color}; font-weight: 600;">${estado.texto}</td>
      </tr>
    `;
    }).join('');
}

// ── CARGAR TODOS LOS DATOS ───────────────────────────────
async function cargarDatos() {
    try {
        // Hacemos las tres peticiones en paralelo
        const [resLecturas, resPromedio, resUltima] = await Promise.all([
            fetch('/api/sensor/lecturas'),
            fetch('/api/sensor/promedio'),
            fetch('/api/sensor/ultima')
        ]);

        const { lecturas }  = await resLecturas.json();
        const { promedio }  = await resPromedio.json();
        const { ultima }    = await resUltima.json();

        // Actualizamos la UI
        actualizarMetricas(ultima, promedio);
        dibujarGraficoLinea(lecturas);
        dibujarGauge(ultima ? ultima.humedad : 0);
        actualizarTabla(lecturas);

    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

// ── LOGOUT ───────────────────────────────────────────────
document.getElementById('btn-logout').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
});

// ── INICIALIZACIÓN ───────────────────────────────────────
async function init() {
    // Verificamos que haya sesión activa
    const usuario = await verificarSesion();
    if (!usuario) return;

    // Mostramos el saludo
    document.getElementById('saludo').textContent = `Bienvenido, ${usuario.nombre}`;

    // Cargamos los datos
    await cargarDatos();

    // Actualizamos los datos cada 30 segundos automáticamente
    setInterval(cargarDatos, 30000);
}

init();