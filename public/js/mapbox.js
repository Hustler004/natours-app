/* eslint-disable */

export const displayMap = (locations) => {
  var map = new maplibregl.Map({
    container: 'map',
    style: 'https://demotiles.maplibre.org/style.json', // stylesheet location
    scrollZoom: false,
    // center: [-74.5, 40], // starting position [lng, lat]
    zoom: 4, // starting zoom
    // interactive: false,
  });
  const bounds = new maplibregl.LngLatBounds();

  locations.forEach((loc) => {
    //create marker
    const el = document.createElement('div');
    el.className = 'marker';

    //add marker
    new maplibregl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);
    //add popup

    new maplibregl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // extend the map bounds to include the current locations
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 150,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
