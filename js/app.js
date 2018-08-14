var map;
var markers = [];
var locations = [
    {title: "Sagrada Família", coords: {lat: 41.404427, lng: 2.174302}},
    {title: "Park Güell", coords: {lat: 41.414446, lng: 2.152665}},
    {title: "Arc de Triomf", coords: {lat: 41.391085, lng: 2.180634}},
    {title: "Vila de Gràcia", coords: {lat: 41.400240, lng: 2.157652}},
    {title: "Plaça Reial", coords: {lat: 41.380207, lng: 2.175502}}
];
var $window = $(window);

/* ------- ANIMATIONS ------- */

showLocations = function() {
    locationsList =  document.getElementById("locations-list");
    locationsList.style.animationName = "showLocations";
    locationsList.style.display = "block";
    setLocationListStatus(true);
};

const hideLocations = async function() {
    locationsList = document.getElementById("locations-list");
    locationsList.style.animationName = "hideLocations";
    await sleep(1000);
    locationsList.style.display = "none";
    setLocationListStatus(false);
};

showWikipedia = function(text) {
    wikiText = document.getElementById("wikipedia-text");
    wikiText.style.animationName = "goDown";
    wikiText.innerHTML = text;
    wikiText.style.display = "block";
};

const hideWikipedia = wikiText => async function() {
    wikiText.style.animationName = "goUp";
    await sleep(1000);
    wikiText.style.display = "none";
};

// The arrow function doesn't work inside the view model.
const hideWikipedia2 = async function(wikiText) {
    wikiText.style.animationName = "goUp";
    await sleep(1000);
    wikiText.style.display = "none";
};

/* ------- VIEW MODEL ------- */

var ViewModel = function() {
    filterText = ko.observable();

    filteredLocations = ko.observableArray();

    for(var i = 0; i < locations.length; i++) {
        filteredLocations.push({title: locations[i].title});
    }

    locationsListOpened = ko.observable(false);

    var infoWindow;

    // Keeps track of the dimension of the window to make the site responsive.
    windowWidth = ko.observable($window.width());
    $window.resize(function () {
        windowWidth($window.width());
    });

    // Try to asynchronously load Google Maps API.
    $.getScript("http://maps.googleapis.com/maps/api/js?key=AIzaSyAzCclQVYZ2-KhSm_9PvWYbprYp2szXH_Q&v=3&callback=initMap")
    .done(function() {
        infoWindow = new google.maps.InfoWindow();
    })
    .fail(function() {
        alert("Error loading Google Maps API");
    });

    // Create the map centered in Barcelona.
    initMap = function() {
        map = new google.maps.Map(document.getElementById("map"), {
            center: {lat: 41.3887900, lng: 2.1589900},
            zoom: 13,
            mapTypeControl: false
        });

        addMarkers();
    };

    // Add markers to the map based on "locations" array.
    addMarkers = function() {
        for(var i = 0; i < locations.length; i++) {
            markers.push(
                new google.maps.Marker({
                    position: locations[i].coords,
                    map: map,
                    title: locations[i].title
                })
            );

            markers[i].addListener("click", async function() {
                this.setAnimation(google.maps.Animation.BOUNCE);
                await sleep(500);
                this.setAnimation(null);

                showInfoWindow(this);
            });
        }
    };

    // Adds an info window to the marker.
    showInfoWindow = function(marker) {
        infoWindow.marker = marker;
        var content = document.createElement("div");
        var showMore;
        content.innerHTML = "<h2>" + marker.title + "</h2>";
        showMore = content.appendChild(document.createElement("p"));
        showMore.setAttribute("id", "wiki-link");
        showMore.innerHTML = "SHOW MORE";
        infoWindow.setContent(content);
        // Clicking "Show More" shows informations from Wikipedia.
        google.maps.event.addDomListener(showMore,'click', function(){
            callWikipedia(marker.title);
        });
        infoWindow.open(map, marker);
        infoWindow.addListener('closeclick', function() {
            infoWindow.marker = null;
        });
    };

    // Get infos from Wikipedia and pass them to the view.
    callWikipedia = function(title) {
        $.get({
            url: "https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=" + title,
            dataType: "jsonp"
        })
        .done(function(response) {
            pages = response.query.pages;
            // The next key is the id of the page but we don't have it, so we find it with this for.
            var id;
            for (key in pages)
                id = key;
            showWikipedia(pages[id].extract);
        })
        .fail(function() {
            showWikipedia("WIKIPEDIA API ERROR");
        });
    };

    // This function is used to hide the elements before their animations are finished.
    sleep = async function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    // Filters locations based on user's input.
    findLocation = function() {
        var formattedFilterText = filterText().toLowerCase();
        var formattedLocation;

        filteredLocations.removeAll();

        for(var i = 0; i < locations.length; i++) {
            formattedLocation = locations[i].title.toLowerCase();
            if(formattedLocation.search(formattedFilterText) == -1) {
                markers[i].setMap(null); // Hide a marker.
            }
            else {
                filteredLocations.push({title: locations[i].title});
                markers[i].setMap(map); // Show a marker.
            }
        }
    };

    setLocationListStatus = function(status) {
        locationsListOpened(status);
    };

    // Handles the click event on an element from the list.
    selectMarker = function(data) {
        if(windowWidth() < 570) {
            hideLocations();
        }
        hideWikipedia2(document.getElementById("wikipedia-text"));
        title = data.title;
        for(var i = 0; i < markers.length; i++) {
            if(markers[i].title == title) {
                // Simulates a click to the marker.
                google.maps.event.trigger(markers[i], 'click');
            }
        }
    };
};

ko.applyBindings(ViewModel);

ko.onError = function(error) {
    alert("Knockout error: " + error);
};