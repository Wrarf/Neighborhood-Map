"use strict";

let map;
const $window = $(window);


/* ------- ERROR HANDLERS ------- */

ko.onError = function(error) {
    alert("Knockout error: " + error);
};

function googleAPIError() {
    alert("Google Maps API Error");
}


/* ------- VIEW MODEL ------- */

const ViewModel = function() {
    const self = this;

    this.filterText = ko.observable("");

    this.filteredLocations = ko.observableArray();
    for(let i = 0; i < Model.locations.length; i++) {
        this.filteredLocations.push({title: Model.locations[i].title});
    }

    this.locationsListOpened = ko.observable(false);

    this.infoWindow;

    // Keeps track of the dimension of the window to make the site responsive.
    this.windowWidth = ko.observable($window.width());
    $window.resize(function () {
        self.windowWidth($window.width());
    });

    this.listOpenedOnce = ko.observable(false); // (At least once)

    this.listClass = ko.pureComputed(function() {
        return self.locationsListOpened() ? "visibleList" : (self.listOpenedOnce() ? "hiddenList" : "");
    });

    // Add markers to the map based on "locations" array.
    this.addMarkers = function() {
        for(let i = 0; i < Model.locations.length; i++) {
            Model.markers.push(
                new google.maps.Marker({
                    position: Model.locations[i].coords,
                    map: map,
                    title: Model.locations[i].title
                })
            );

            Model.markers[i].addListener("click", async function() {
                this.setAnimation(google.maps.Animation.BOUNCE);
                await self.sleep(500);
                this.setAnimation(null);

                self.callWikipedia(this);
            });
        }
    };

    // Get infos from Wikipedia and pass them to the view.
    this.callWikipedia = function(marker) {
        $.get({
            url: "https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=" + marker.title,
            dataType: "jsonp"
        })
        .done(function(response) {
            let pages = response.query.pages;
            // The next key is the id of the page but we don't have it, so we find it with this for.
            let id;
            for (let key in pages)
                id = key;
            self.showInfoWindow(marker, pages[id].extract);
        })
        .fail(function() {
            self.   showInfoWindow(marker, "WIKIPEDIA API ERROR");
        });
    };

    // Adds an info window to the marker.
    this.showInfoWindow = function(marker, wikiText) {
        self.infoWindow.marker = marker;
        const maxChars = 5 * 100; // 100 words with an average of 5 letters each.
        if(wikiText.length > maxChars) {
            for(let i = maxChars; i < wikiText.length; i++) {
                if(wikiText[i] == " ") {
                    wikiText = wikiText.slice(0, i);
                    wikiText += "...";
                    break;
                }
            }
        }
        let infoContent = "<div class=\"info-window\">" + wikiText + "</div>";
        infoContent += "<a href=\"https://en.wikipedia.org/wiki/" + marker.title + "\">More Informations</a>";
        self.infoWindow.setContent(infoContent);
        self.infoWindow.addListener("closeclick", function() {
            self.infoWindow.marker = null;
        });
        self.infoWindow.open(map, marker);
    };

    this.sleep = async function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Filters locations based on user's input.
    this.findLocation = ko.computed(function() {
        let formattedFilterText = self.filterText().toLowerCase();
        let formattedLocation;

        if(Model.markers.length == 0) { // Execute only if markers are defined.
            return;
        }

        self.filteredLocations.removeAll();

        for(let i = 0; i < Model.locations.length; i++) {
            formattedLocation = Model.locations[i].title.toLowerCase();
            if(formattedLocation.search(formattedFilterText) == -1) {
                Model.markers[i].setMap(null); // Hide a marker.
            } else {
                self.filteredLocations.push({title: Model.locations[i].title});
                Model.markers[i].setMap(map); // Show a marker.
            }
        }
    });

    this.setLocationListStatus = function(status) {
        if(self.windowWidth() >= 570) {
            return;
        }
        if(!self.listOpenedOnce()) {
            self.listOpenedOnce(true);
        }
        self.locationsListOpened(status);
    };

    // Handles the click event on an element from the list.
    this.selectMarker = function(data) {
        const title = data.title;
        for(let i = 0; i < Model.markers.length; i++) {
            if(Model.markers[i].title == title) {
                // Simulates a click to the marker.
                google.maps.event.trigger(Model.markers[i], 'click');
            }
        }
    };
};


/* ------- INIT FUNCTION ------- */

// Create the map centered in Barcelona and instantiate ViewModel.
function initMap() {
    map = new google.maps.Map(document.querySelector(".map"), {
        center: {lat: 41.3887900, lng: 2.1589900},
        zoom: 13,
        mapTypeControl: false
    });

    const viewModel = new ViewModel();
    ko.applyBindings(viewModel);

    viewModel.infoWindow = new google.maps.InfoWindow({
        maxWidth: 300
    });
    viewModel.addMarkers();
}
