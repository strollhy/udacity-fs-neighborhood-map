var map;
var largeInfowindow;

// Create a new blank array for all the listing markers.
var locations = [
  {name: 'Buckingham Fountain', location: {lat: 41.875631, lng: -87.619024}},
  {name: 'Lincoln Park Zoo', location: {lat: 41.921070, lng: -87.633959}},
  {name: 'Millennium Park', location: {lat: 41.882602, lng: -87.622539}},
  {name: 'Museum Campus', location: {lat: 41.861465, lng: -87.614908}},
  {name: 'Navy Pier', location: {lat: 41.891614, lng: -87.607877}},
  {name: 'Shedd Aquarium', location: {lat: 41.867562, lng: -87.614014}},
  {name: 'Willis Tower', location: {lat: 41.878860, lng: -87.635870}},
];

function initMap() {
  // Constructor creates a new map - only center and zoom are required.
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 41.881832, lng: -87.623177},
    zoom: 13,
    mapTypeControl: false
  });

  createMarkers(locations);
  showListings(locations);

  // Bind ViewModel
  ko.applyBindings(new MarkersViewModel());
};

// ViewModel for markers
function MarkersViewModel() {
  // Data
  this.locations = ko.observable(locations);
  this.keyword = ko.observable();

  // Behaviours
  this.filterLocation = function() {
    hideListings();

    var locs = [];
    var keyword = this.keyword();

    for (var i = 0; i < locations.length; i++) {
      if (!keyword || locations[i].name.includes(keyword)) {
        locs.push(locations[i]);
      }
    }

    showListings(locs);
    this.locations(locs);
    return true;
  };

  this.showLocation = function(location) {
    populateInfoWindow(location.marker, largeInfowindow);
  };
};

// This function creates markers provided with locations
function createMarkers(locations) {
  // The following group uses the location array to create an array of markers on initialize.
  largeInfowindow = new google.maps.InfoWindow();

  for (var i = 0; i < locations.length; i++) {
    // Get the position from the location array.
    var position = locations[i].location;
    var name = locations[i].name;
    
    // Create a marker per location
    var marker = new google.maps.Marker({
      position: position,
      name: name,
      animation: google.maps.Animation.DROP,
      id: i
    });

    // Save marker to its corresponding location
    locations[i].marker = marker;

    // Create an onclick event to open an infowindow at each marker.
    marker.addListener('click', function() {
      populateInfoWindow(this, largeInfowindow);
    });
  }
};

// This function change markers' animation with a timeout
function bounceMarker(marker) {
  marker.setAnimation(google.maps.Animation.BOUNCE);
  window.setTimeout(function() {
    marker.setAnimation(null);
  }, 1400);
};

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
  bounceMarker(marker);

  // Check to make sure the infowindow is not already opened on this marker.
  if (infowindow.marker != marker) {
    $.ajax({
      url: 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + marker.name + '&format=json&callback=wikiCallback',
      dataType: 'jsonp',
      success: function(data) {
        renderInfoWindow(marker, infowindow, renderContent(data));
      },
      error: function(jqXHR, exception) {
        renderInfoWindow(marker, infowindow, renderError());
      }
    })
  }
};

function renderInfoWindow(marker, infowindow, content) {
  infowindow.marker = marker;
  infowindow.setContent(content);
  infowindow.open(map, marker);
  // Make sure the marker property is cleared if the infowindow is closed.
  infowindow.addListener('closeclick', function() {
    infowindow.marker = null;
  });
};

// Renders content from response, and renders error message when error occurs
function renderContent(data) {
  try {
    var content = '<h5>' + data[0] + '</h5>';
    content += '<p>' + data[2][0] + '</p>';
    content += '<a href="https://www.mediawiki.org/wiki/API:Main_page">powered by MediaWiki</a>';
    return '<div>' + content + '</div>';
  } catch(err) {
    return renderError();
  };
};

function renderError() {
  return '<div>' + 'Something is wrong...' + '</div>';
};

// This function will loop through the markers array and display them all.
function showListings(locations) {
  var bounds = new google.maps.LatLngBounds();
  var cnt = 0;
  // Extend the boundaries of the map for each marker and display the marker
  for (var i = 0; i < locations.length; i++) {
    cnt += 1;
    locations[i].marker.setMap(map);
    bounds.extend(locations[i].marker.position);
  };

  if (cnt > 1) {
    map.fitBounds(bounds);
  };
};

// This function will loop through the listings and hide them all.
function hideListings() {
  for (var i = 0; i < locations.length; i++) {
    locations[i].marker.setMap(null);
  }
};
