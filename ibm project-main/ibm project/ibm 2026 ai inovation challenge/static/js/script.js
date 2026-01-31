// Theme toggle
const themeToggle = document.getElementById('themeToggle');
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add('dark');
    themeToggle.querySelector('i.fa-moon').classList.add('hidden');
    themeToggle.querySelector('i.fa-sun').classList.remove('hidden');
}
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.theme = document.body.classList.contains('dark') ? 'dark' : 'light';
    themeToggle.querySelector('i.fa-moon').classList.toggle('hidden');
    themeToggle.querySelector('i.fa-sun').classList.toggle('hidden');
});

// Map setup with forced full load
const map = L.map('map', {
    zoomControl: true,
    attributionControl: true,
    minZoom: 10,          // Prevent too much zoom out
    maxZoom: 18
}).setView([22.41, 72.90], 14);  // Borsad center, zoom level for full view

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    detectRetina: true    // Better for high-res screens
}).addTo(map);

const markers = L.markerClusterGroup().addTo(map);
let userMarker;

map.on('click', e => {
    if (userMarker) markers.removeLayer(userMarker);
    userMarker = L.marker(e.latlng, {
        icon: L.divIcon({ className: '', html: '<i class="fa-solid fa-location-dot text-4xl text-red-600"></i>', iconSize: [48, 48], iconAnchor: [24, 48] })
    }).addTo(markers);
    document.getElementById('lat').value = e.latlng.lat.toFixed(6);
    document.getElementById('lng').value = e.latlng.lng.toFixed(6);
    map.setView(e.latlng, 16);
});

// Recenter function for button
window.recenterMap = function () {
    map.setView([22.41, 72.90], 14);
    map.invalidateSize();
}

// Aggressive invalidateSize on multiple events
function forceMapRefresh() {
    setTimeout(() => map.invalidateSize(), 100);
    setTimeout(() => map.invalidateSize(), 500);
    setTimeout(() => map.invalidateSize(), 1000);
    setTimeout(() => map.invalidateSize(), 2000);
    setTimeout(() => map.invalidateSize(true), 3000);  // With animation
}

// Call on load, resize, section visible, and theme change
window.addEventListener('load', forceMapRefresh);
window.addEventListener('resize', forceMapRefresh);
themeToggle.addEventListener('click', () => setTimeout(forceMapRefresh, 300));  // After dark mode switch

const reportSection = document.getElementById('report');
const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
        forceMapRefresh();
    }
}, { threshold: 0.5 });
observer.observe(reportSection);

// Hide loader when map tiles are ready
map.whenReady(() => {
    const loader = document.getElementById('map-loading');
    loader.style.opacity = '0';
    setTimeout(() => loader.style.display = 'none', 800);
});

// Mock AI
document.getElementById('description').addEventListener('input', e => {
    const txt = e.target.value.toLowerCase();
    let cat = '';
    if (/pothole|road|damage/i.test(txt)) cat = 'Pothole/Road Damage';
    else if (/garbage|waste|trash/i.test(txt)) cat = 'Garbage/Waste';
    else if (/light|streetlight/i.test(txt)) cat = 'Street Light Out';
    else if (/water|flood|logging/i.test(txt)) cat = 'Water Logging';
    document.getElementById('aiSuggestion').textContent = cat ? `AI suggests: ${cat}` : 'Describe to get AI help...';
});

document.getElementById('photo').addEventListener('change', async e => {
    if (e.target.files[0]) {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('photo', file);

        document.getElementById('aiAnalysis').textContent = "Analyzing with Gemini AI...";

        try {
            const response = await fetch('/api/ai-analyze', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            document.getElementById('aiAnalysis').textContent = data.analysis;
        } catch (error) {
            console.error('AI Error:', error);
            document.getElementById('aiAnalysis').textContent = "AI Analysis failed to connect.";
        }
    }
});

// Issues data
async function fetchIssues() {
    try {
        const response = await fetch('/api/issues');
        const issues = await response.json();
        renderIssues(issues);
    } catch (error) {
        console.error('Error fetching issues:', error);
    }
}

function renderIssues(issues) {
    const list = document.getElementById('issuesList');
    list.innerHTML = '';
    markers.clearLayers();

    issues.forEach(issue => {
        const statusClass = issue.status === 'Pending' ? 'bg-red-100 text-red-800 dark:bg-red-900/40' :
            issue.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40' :
                'bg-green-100 text-green-800 dark:bg-green-900/40';

        list.innerHTML += `
    <div class="glass p-6 rounded-3xl hover:shadow-2xl transition-all">
        <div class="flex justify-between items-start mb-4">
        <h3 class="text-xl font-bold">${issue.category}</h3>
        <span class="px-4 py-1 rounded-full text-sm font-medium ${statusClass}">${issue.status}</span>
        </div>
        <p class="mb-4">${issue.desc}</p>
        <div class="text-sm opacity-70">Reported: ${new Date(issue.time).toLocaleString()}</div>
    </div>`;

        const color = issue.status === 'Pending' ? '#ef4444' : issue.status === 'In Progress' ? '#f59e0b' : '#10b981';
        L.marker([issue.lat, issue.lng], {
            icon: L.divIcon({
                html: `<i class="fa-solid fa-location-dot text-4xl" style="color:${color}"></i>`,
                iconSize: [48, 48],
                iconAnchor: [24, 48]
            })
        }).addTo(markers)
            .bindPopup(`<b>${issue.category}</b><br>${issue.desc}<br><b>Status:</b> ${issue.status}<br><b>Time:</b> ${new Date(issue.time).toLocaleString()}`);
    });

    document.getElementById('totalIssues').textContent = issues.length;
    document.getElementById('pendingIssues').textContent = issues.filter(i => i.status === 'Pending').length;
    document.getElementById('resolvedIssues').textContent = issues.filter(i => i.status === 'Resolved').length;
}

// Simulate updates (Polling)
setInterval(fetchIssues, 10000);

// Form submit
document.getElementById('reportForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
    btn.disabled = true;

    const newIssue = {
        category: document.getElementById('category').value,
        desc: document.getElementById('description').value,
        lat: parseFloat(document.getElementById('lat').value),
        lng: parseFloat(document.getElementById('lng').value)
    };

    try {
        const response = await fetch('/api/issues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newIssue)
        });

        if (response.ok) {
            await fetchIssues();
            confetti({ particleCount: 150, spread: 90 });
            alert('Report submitted! Pin placed on full map.');
            e.target.reset();
            document.getElementById('aiSuggestion').textContent = 'Describe to get AI help...';
            document.getElementById('aiAnalysis').textContent = '';
        } else {
            alert('Failed to submit report');
        }
    } catch (error) {
        console.error('Error submitting report:', error);
        alert('Error submitting report');
    } finally {
        btn.innerHTML = '<span>Submit Report</span><i class="fa-solid fa-paper-plane"></i>';
        btn.disabled = false;
        forceMapRefresh();
    }
});

// Initial load
fetchIssues();
