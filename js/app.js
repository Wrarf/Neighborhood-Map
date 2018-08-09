var map;
var markers = [];
var wikiText;
var locations = [
    {title: "Sagrada Família", coords: {lat: 41.404427, lng: 2.174302}},
    {title: "Park Güell", coords: {lat: 41.414446, lng: 2.152665}},
    {title: "Arc de Triomf", coords: {lat: 41.391085, lng: 2.180634}},
    {title: "Vila de Gràcia", coords: {lat: 41.400240, lng: 2.157652}},
    {title: "Plaça Reial", coords: {lat: 41.380207, lng: 2.175502}}
];

showLocations = function() {
    locationsList =  document.getElementById("locations-list");
    locationsList.style.animationName = "showLocations";
    locationsList.style.display = "block";
}

const hideLocations = async function() {
    locationsList = document.getElementById("locations-list");
    locationsList.style.animationName = "hideLocations";
    await sleep(1000);
    locationsList.style.display = "none";
}

showWikipedia = function(text) {
    wikiText = document.getElementById("wikipedia-text");
    wikiText.style.animationName = "goDown";
    wikiText.innerHTML = text;
    wikiText.style.display = "block";
};

const hideWikipedia = wikiText => async function() {
    locationsList = document.getElementById("locations-list");
    wikiText.style.animationName = "goUp";
    await sleep(1000);
    wikiText.style.display = "none";
};

var ViewModel = function() {
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
        var title;
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

                // Get infos from Wikipedia and pass them to the view.
                $.get({
                    url: "https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=" + this.title,
                    dataType: "jsonp"
                })
                .done(function(response) {
                    pages = response.query.pages;
                    // The next key is the id of the page but we don"t have it, so we find it with this for.
                    var id;
                    for (key in pages)
                        id = key;
                    showWikipedia(pages[id].extract);
                })
                .fail(function() {
                    showWikipedia("WIKIPEDIA API ERROR");
                });
            });
        }
    };

    sleep = async function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    // Try to asynchronously load Google Maps API.
    $.getScript("http://maps.googleapis.com/maps/api/js?key=AIzaSyAzCclQVYZ2-KhSm_9PvWYbprYp2szXH_Q&v=3&callback=initMap")
    .fail(function() {
        alert("Error loading Google Maps API");
    });
}

ko.applyBindings(ViewModel);