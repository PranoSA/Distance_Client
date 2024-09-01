'use client';
"use strict";
exports.__esModule = true;
var react_1 = require("react");
require("ol/ol.css");
var ol_1 = require("ol");
var Tile_1 = require("ol/layer/Tile");
var OSM_1 = require("ol/source/OSM");
var proj_1 = require("ol/proj");
var condition_1 = require("ol/events/condition");
var interaction_1 = require("ol/interaction");
var Vector_1 = require("ol/layer/Vector");
var Vector_2 = require("ol/source/Vector");
var turf = require("@turf/turf");
var geom_1 = require("ol/geom");
var proj4_1 = require("proj4");
var proj_js_1 = require("ol/proj.js");
var proj4_js_1 = require("ol/proj/proj4.js");
var style_1 = require("ol/style");
proj4_1["default"].defs('EPSG:27700', '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 ' +
    '+x_0=400000 +y_0=-100000 +ellps=airy ' +
    '+towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 ' +
    '+units=m +no_defs');
proj4_1["default"].defs('EPSG:3035', '+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +units=m +no_defs');
//now, 9834
proj4_1["default"].defs('EPSG:9834', '+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +units=m +no_defs');
//6933
proj4_1["default"].defs('EPSG:6933', '+proj=cea +lon_0=0 +lat_ts=30 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs');
//Proj4js.defs["EPSG:3035"] = "+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +units=m +no_defs";
proj4_js_1.register(proj4_1["default"]);
var proj27700 = proj_js_1.get('EPSG:27700');
if (!proj27700) {
    throw new Error('Projection not found');
}
proj27700.setExtent([0, 0, 700000, 1300000]);
var proj9834 = proj_js_1.get('EPSG:9834');
if (!proj9834) {
    throw new Error('Projection not found');
}
proj9834.setExtent([-20037508.34, -20037508.34, 20037508.34, 20037508.34]);
var proj6933 = proj_js_1.get('EPSG:6933');
if (!proj6933) {
    throw new Error('Projection not found');
}
proj6933.setExtent([-17367530.45, -7314540.66, 17367530.45, 7314540.66]);
var proj3035 = proj_js_1.get('EPSG:3035');
if (!proj3035) {
    throw new Error('Projection not found');
}
var MapComponent = function () {
    var mapRef = react_1.useRef(null);
    var _a = react_1.useState(null), coordinates = _a[0], setCoordinates = _a[1];
    var _b = react_1.useState(0.0), circle_radius = _b[0], set_circle_radius = _b[1];
    var circleVectorLayer = react_1.useRef(null);
    var gridVectorLayer = react_1.useRef(null);
    // Function to create latitude and longitude lines
    var createLatLonLines = function () {
        var features = [];
        var latitudes = [
            -90, -80, -70, -60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60,
            70, 80, 90,
        ];
        var longitudes = [
            -180, -170, -160, -150, -140, -130, -120, -110, -100, -90, -80, -70, -60,
            -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110,
            120, 130, 140, 150, 160, 170, 180,
        ];
        // Create latitude lines
        latitudes.forEach(function (lat) {
            var coords = [];
            for (var lon = -180; lon <= 180; lon += 1) {
                coords.push(proj_1.fromLonLat([lon, lat], 'EPSG:6933'));
            }
            var new_feature = new ol_1.Feature({
                geometry: new geom_1.LineString(coords)
            });
            //style feature according to this
            // 0 = black
            // -30, 30 = red
            // -45, 45 = green
            // -60, 60 = blue
            // -75, 75 = yellow
            var new_style = new style_1.Style({
                stroke: new style_1.Stroke({
                    color: 'black',
                    width: 1
                })
            });
            /*if (lat === -30 || lat === 30) {
              new_style.setStroke(new Stroke({ color: 'red', width: 1 }));
            } else if (lat === -45 || lat === 45) {
              new_style.setStroke(new Stroke({ color: 'green', width: 1 }));
            } else if (lat === -60 || lat === 60) {
              new_style.setStroke(new Stroke({ color: 'blue', width: 1 }));
            } else if (lat === -75 || lat === 75) {
              new_style.setStroke(new Stroke({ color: 'yellow', width: 1 }));
            }*/
            //add style to feature
            new_feature.setStyle(new_style);
            features.push(new_feature);
        });
        // Create longitude lines
        longitudes.forEach(function (lon) {
            var coords = [];
            for (var lat = -90; lat <= 90; lat += 1) {
                coords.push(proj_1.fromLonLat([lon, lat], 'EPSG:6933'));
            }
            //style feature according to this
            // 0  = yellow
            // -180, 180 = black
            // -120, 120 = red
            // -60, 60 = green
            var new_style = new style_1.Style({
                stroke: new style_1.Stroke({
                    color: 'black',
                    width: 1
                })
            });
            if (lon === -120 || lon === 120) {
                new_style.setStroke(new style_1.Stroke({ color: 'red', width: 1 }));
            }
            else if (lon === -60 || lon === 60) {
                new_style.setStroke(new style_1.Stroke({ color: 'green', width: 1 }));
            }
            else if (lon === 0) {
                new_style.setStroke(new style_1.Stroke({ color: 'yellow', width: 1 }));
            }
            var new_feature = new ol_1.Feature({
                geometry: new geom_1.LineString(coords)
            });
            //add style to feature
            new_feature.setStyle(new_style);
            features.push(new_feature);
        });
        return features;
    };
    // when circle_radius, or coordinates change, update the circle
    react_1.useEffect(function () {
        if (coordinates && circleVectorLayer.current) {
            //convert 3035 coordinate to 4326
            var convert_3035_to_4326 = function (coordinate) {
                return proj_1.toLonLat(coordinate, 'EPSG:6933');
            };
            // use turf to create a circle
            var circle = turf.circle(convert_3035_to_4326(coordinates), circle_radius, {
                steps: 64,
                units: 'meters'
            });
            var circle_points = circle.geometry.coordinates[0].map(function (coord) {
                return proj_1.fromLonLat(coord, 'EPSG:6933');
            });
            // convert the circle to a vector layer
            var circleFeature3035 = new ol_1.Feature({
                geometry: new geom_1.Polygon([circle_points])
            });
            if (!circleVectorLayer.current.getSource())
                return;
            // add the circle to the vector layer
            //@ts-ignore
            circleVectorLayer.current.getSource().clear();
            //@ts-ignore
            circleVectorLayer.current.getSource().addFeature(circleFeature3035);
        }
    }, [coordinates, circle_radius]);
    react_1.useEffect(function () {
        if (mapRef.current) {
            circleVectorLayer.current = new Vector_1["default"]({
                source: new Vector_2["default"]()
            });
            var features = createLatLonLines();
            var grid_source = new Vector_2["default"]({
                features: features
            });
            gridVectorLayer.current = new Vector_1["default"]({
                source: grid_source,
                style: new style_1.Style({
                    stroke: new style_1.Stroke({
                        color: 'red',
                        width: 1
                    })
                })
            });
            var map_1 = new ol_1.Map({
                target: mapRef.current,
                layers: [
                    new Tile_1["default"]({
                        source: new OSM_1["default"]()
                    }),
                    circleVectorLayer.current,
                    gridVectorLayer.current,
                ],
                view: new ol_1.View({
                    center: proj_1.fromLonLat([0, 0]),
                    zoom: 2,
                    //projection: 'EPSG:3035',
                    projection: 'EPSG:6933'
                })
            });
            var selectClick = new interaction_1.Select({
                condition: condition_1.click
            });
            map_1.addInteraction(selectClick);
            map_1.on('click', function (event) {
                var clickedCoordinate = event.coordinate;
                if (!clickedCoordinate)
                    return;
                setCoordinates(clickedCoordinate);
            });
            return function () {
                map_1.setTarget('');
            };
        }
    }, []);
    return (react_1["default"].createElement("div", null,
        react_1["default"].createElement("div", { ref: mapRef, style: { width: '100%', height: '400px' } }),
        coordinates && (react_1["default"].createElement("div", { className: "w-full flex flex-row" },
            react_1["default"].createElement("div", { className: "w-1/2" },
                react_1["default"].createElement("p", null, "Coordinates (EPSG:3035):"),
                react_1["default"].createElement("p", null,
                    "X: ",
                    coordinates[0]),
                react_1["default"].createElement("p", null,
                    "Y: ",
                    coordinates[1])),
            react_1["default"].createElement("div", { className: "w-1/2" },
                react_1["default"].createElement("p", null, " Coordinates (ESPG:4326) "),
                react_1["default"].createElement("p", null,
                    "[",
                    proj_1.toLonLat(coordinates, 'EPSG:6933')[0].toFixed(6),
                    ",",
                    ' ',
                    proj_1.toLonLat(coordinates, 'EPSG:6933')[1].toFixed(6),
                    ".]")))),
        /* Slider to set the circle radius */
        react_1["default"].createElement("input", { type: "range", min: "0", max: "10000000", value: circle_radius, onChange: function (event) {
                set_circle_radius(parseFloat(event.target.value));
            } }),
        react_1["default"].createElement("div", { style: { display: 'flex', flexDirection: 'column' } },
            react_1["default"].createElement("p", null,
                "Circle Radius: ",
                circle_radius,
                " meters"))));
};
var HomePage = function () {
    return (react_1["default"].createElement("div", null,
        react_1["default"].createElement("h1", null, "OpenLayers Map with Click Events"),
        react_1["default"].createElement(MapComponent, null)));
};
exports["default"] = HomePage;
