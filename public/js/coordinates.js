/*!
 * coordinates.io
 *
 * app.js
 * Author: Michael Birsak
 * Version: 0.0.1
 *
 * (c) 2013 Michael Birsak / Thomas Lichtblau
 * Licensed under MIT
 */

/*************************************************************************/
/* coordinates.io - App
/*************************************************************************/

(function(window, document, $, undefined) {

	var App = {

		// Initialize default options object
		options: {},

		// Default DOM elements to mainpulate
		elements: {

			map: document.getElementById('map'),
			searchInput: document.getElementById('location'),
			$searchInput: $('#location'),
			$swLat: $('#coordinates-swlat'),
			$swLng: $('#coordinates-swlng'),
			$neLat: $('#coordinates-nelat'),
			$neLng: $('#coordinates-nelng'),
			$point: $('#coordinates-point')

		},

		/**
		 * setOptions :: void
		 * Initializes all default app options
		 **/
		setOptions: function() {

			// Random start locations
			App.options.locationCenter = new Array(
				new google.maps.LatLng(40.701966982259106, -74.0003790435791),
				new google.maps.LatLng(38.080443167851655, 22.630730867385864),
				new google.maps.LatLng(27.88977386224803, -82.84113585948944),
				new google.maps.LatLng(63.1001412, 21.59100000001)
			);

			// Google maps default options
			App.options.mapOptions = {
				center: App.options.locationCenter[Math.floor(Math.random() * 4)],
				zoom: 14,
				disableDefaultUI: true,
				mapTypeControl: true,
				mapTypeControlOptions: {
					style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
					position: google.maps.ControlPosition.BOTTOM_CENTER
				},
				mapTypeId: google.maps.MapTypeId.SATELLITE
			};

			// Google maps rectangle default options
			App.options.rectangleOptions = {
				bounds: App.options.bounds,
				editable: true,
				draggable: true,
				fillColor: '#2fe6c1',
				fillOpacity: 0.4,
				strokeWeight: 0
			};

			// Google places default options
			App.options.placesOptions = {
				types: ['geocode']
			};

			// Google maps marker options
			App.options.markerOptions = {
				icon: '/img/marker.png'
			};

			// Initial map Boundaries
			App.options.bounds = null;

			// Save the initial status
			App.options.initialSearch = true;

		},

		/**
		 * init :: void
		 * Initializes all objects and depended functions
		 **/
		init: function() {

			// Set default options
			App.setOptions();

			// Google maps object
			App.map = new google.maps.Map(App.elements.map, App.options.mapOptions);

			// Google maps rectangle object
			App.rectangle = new google.maps.Rectangle(App.options.rectangleOptions);

			// Google places autocomplete object 1 (Main search input)
			App.autocomplete = new google.maps.places.Autocomplete(App.elements.searchInput, App.options.placesOptions);

			// Google maps marker object
			App.marker = new google.maps.Marker(App.options.markerOptions);
			App.marker.setMap(App.map);

			// Register and bind all events
			App.registerEvents();

			// Set the focus on the main search input field
			//App.elements.$searchInput.focus();

		},

		/**
		 * registerEvents :: void
		 * Registers and binds all events
		 **/
		registerEvents: function() {

			// Google maps events
			google.maps.event.addListener(App.autocomplete, 'place_changed', function() {
				App.placeChanged(App.autocomplete);
			});

			google.maps.event.addListener(App.rectangle, 'bounds_changed', function() {
				App.rectangleBoundsChanged();
			});

			google.maps.event.addListener(App.map, 'maptypeid_changed', function() {
				App.mapTypeChanged();
			});

		},


		/**
		 * laodMapScript :: void
		 * Loads the google maps script asynchronously
		 **/
		loadMapScript: function() {

			var script = document.createElement('script');
			script.type = 'text/javascript';
			script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyA0UG5tXW2lWXZmBdDgJPnqi2r1aDTxNgE&v=3.exp&sensor=true&libraries=places&callback=initializeApplication';
			document.body.appendChild(script);

		},

		/**
		 * setLocation :: void
		 * Sets the right location on the map
		 **/
		setLocation: function() {

			// Check if boundaries are available for the location
			if(typeof App.options.bounds !== "undefined") {

				// Fit the bounds
				App.map.fitBounds(App.options.bounds);

				// Pan to the center
				App.map.panTo(App.options.locationCenter);

				// Set the rectangle
				App.setRectangle();

				// Set the marker
				App.setMarker(App.options.locationCenter);


			// Display only the marker if no boundaries are available
			} else {

				// Pan to the center
				App.map.panTo(App.options.locationCenter);

				// Set the marker
				App.setMarker(App.options.locationCenter);

				// Set N/A for boundaries
				App.elements.$swLat.html("N/A");
				App.elements.$swLng.html("N/A");
				App.elements.$neLat.html("N/A");
				App.elements.$neLng.html("N/A");


			}

		},

		/**
		 * setRectangle :: void
		 * Sets the rectangle onto the map
		 **/
		setRectangle: function() {

			App.rectangle.setBounds(App.options.bounds);
			App.rectangle.setMap(App.map);

		},

		/**
		 * setMarker :: google.maps.LatLng -> void
		 * Sets the marker onto the map
		 **/
		setMarker: function(position) {

			var markerPositionText = position.lat() + " , " + position.lng();

			// Set the marker on the map
			App.marker.setPosition(position);

			// Update DOM elements
			App.elements.$point.html(markerPositionText);

		},

		/**
		 * rectangleBoundsChanged :: void
		 * Updates the DOM elements if the user changes the rectangles position
		 **/
		rectangleBoundsChanged: function() {

			var sw = App.rectangle.bounds.getSouthWest(),
				ne = App.rectangle.bounds.getNorthEast(),
				rectanglePositionText = sw.lng() + " , " + sw.lat() + " , " + ne.lng() + " , " + ne.lat();

			// Update DOM elements
			App.elements.$swLat.html(sw.lat());
			App.elements.$swLng.html(sw.lng());
			App.elements.$neLat.html(ne.lat());
			App.elements.$neLng.html(ne.lng());


		},

		/**
		 * placeChanged :: google.maps.places.Autocomplete -> void
		 * If the place changes, set new location accordingly
		 **/
		placeChanged: function(autocomplete) {

			var place = autocomplete.getPlace();

			App.options.locationCenter = place.geometry.location;
			App.options.bounds = place.geometry.viewport;

			// Set location
			App.setLocation();

		},

		/**
		 * mapTypeChanged ::  void
		 * If the map type changes, adjust the opacity of the rectangle for better visibility
		 **/
		mapTypeChanged: function() {

			if (App.map.getMapTypeId() === "roadmap") {
				App.rectangle.setOptions({
					fillOpacity: 0.7
				});
			} else {
				App.rectangle.setOptions({
					fillOpacity: 0.4
				});
			}

		},

		/**
		 * tryGeolocation :: void
		 * Tries if geolocation is activated and sets the map center accordingly
		 * (DEACTIVATED FOR COORDINATES.IO)
		 **/
		tryGeolocation: function() {

			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(function(position) {

					App.options.locationCenter = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
					App.options.zoom = 8;

					App.map.setCenter(App.options.locationCenter);
					App.map.setZoom(App.options.zoom);

				}, function() {
					App.handleNoGeolocation(true, map);
				});
			} else {
				App.handleNoGeolocation(false, map);
			}

		},

		/**
		 * handleNoGeolocation :: errorFlag -> void
		 * If GeoLocation not activated, set default options
		 * (DEACTIVATED FOR COORDINATES.IO)
		 **/
		handleNoGeolocation: function(errorFlag) {

			App.map.setCenter(App.options.locationCenter[0]);
			App.map.setZoom(App.options.zoom);

		}

	};

	/*==========  coordinates.io - asynchronous app initializer callback  ==========*/

	initializeApplication = function() {
		App.init();
	};

	/*==========  coordinates.io - onLoad  ==========*/

	$(window).on('load', App.loadMapScript);

})(window, document, jQuery);