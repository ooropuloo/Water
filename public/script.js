const API_BASE = 'https://iot.kiang.org.tw/civil-iot/v1.0'; // Replace with actual API base

const map = L.map('map').setView([23.6978, 120.9605], 7); // Taiwan center
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

document.getElementById('locate-btn').addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('瀏覽器不支援地理定位');
    return;
  }

  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    map.setView([latitude, longitude], 13);
    L.marker([latitude, longitude]).addTo(map).bindPopup('您所在的位置').openPopup();
    fetchNearbySensors(latitude, longitude);
  }, err => {
    alert('取得定位失敗: ' + err.message);
  });
});

function fetchNearbySensors(lat, lon) {
  const radius = 5000; // 5 km
  const filter = `st_distance(Locations/location, geography'POINT(${lon} ${lat})') lt ${radius}`;
  const url = `${API_BASE}/Things?$filter=${encodeURIComponent(filter)}&$expand=Datastreams($top=1;$orderby=phenomenonTime%20desc),Locations`;
  fetch(url)
    .then(res => res.json())
    .then(data => {
      (data.value || []).forEach(thing => {
        const loc = thing.Locations[0];
        if (!loc) return;
        const coords = [loc.location.coordinates[1], loc.location.coordinates[0]]; // [lat, lon]
        const datastream = thing.Datastreams[0];
        if (!datastream) return;

        fetchLatestObservation(datastream['@iot.id']).then(result => {
          const value = result ? result.result : '無資料';
          const popup = `${thing.name}<br>水位: ${value}`;
          L.marker(coords).addTo(map).bindPopup(popup);
        });
      });
    })
    .catch(err => {
      console.error(err);
      alert('取得感測器資料失敗');
    });
}

function fetchLatestObservation(datastreamId) {
  const url = `${API_BASE}/Datastreams(${datastreamId})/Observations?$top=1&$orderby=phenomenonTime%20desc`;
  return fetch(url)
    .then(res => res.json())
    .then(data => data.value && data.value[0])
    .catch(() => null);
}
