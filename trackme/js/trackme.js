dojo.require("esri.map");
dojo.require("esri.layers.graphics");
dojo.require("dojox.storage");
dojo.require("dojox.mobile.ScrollableView")
dojo.require("dojox.mobile.Heading")
dojo.require("dojox.mobile.RoundRectList");
dojo.require("dojox.mobile.ListItem");
var map, positionWatchId, layerId = 'tempLayer', polyline, storageProvider;
function init() {
    dojo.byId('divListItems').style.visibility = "hidden";
    map = new esri.Map("map", { basemap: "streets" });
    dojox.storage.manager.initialize();
    storageProvider = dojox.storage.manager.getProvider(); storageProvider.initialize();
    polyline = new esri.geometry.Polyline(new esri.SpatialReference({ wkid: 102100 }));
    dojo.connect(map, "onLoad", function (evt) {
        navigator.geolocation.getCurrentPosition(zoomToLocation, locationError);
    });
    map.addLayer(new esri.layers.GraphicsLayer({ id: layerId }));
}
function toggleControls(controlArray) {
    for (var i in controlArray) { dojo.byId(i).style.display = controlArray[i]; }
}
function clearSettings() {
    map.graphics.clear(); map.getLayer(layerId).clear(); graphic = null;
}
function startWatch() {
    clearSettings(); polyline.addPath([]);
    toggleControls({ "imgStart": "none", "imgEnd": "block", "imgClear": "none", "imgLoadRoute": "none" });
    positionWatchId = navigator.geolocation.watchPosition(zoomToLocation, locationError, { enableHighAccuracy: true, maximumAge: 30000, timeout: 5000 });
}
function endWatch() {
    toggleControls({ "imgStart": "block", "imgEnd": "none", "imgClear": "block", "imgLoadRoute": "block" });
    navigator.geolocation.clearWatch(positionWatchId);
    if (confirm("Do you want to save the route?")) {
        var name;
        do { name = prompt("Enter a name of the Route. ", "RouteName"); } while (!/^[0-9a-zA-Z]+$/.test(name))
        var routeStorage = (storageProvider.get("routeStorage")) ? storageProvider.get("routeStorage") : {};
        routeStorage[name] = map.getLayer(layerId).graphics[0].toJson();
        storageProvider.put("routeStorage", routeStorage);
    }
    polyline = new esri.geometry.Polyline(new esri.SpatialReference({ wkid: 102100 }));
    navigator.geolocation.clearWatch(positionWatchId);
    positionWatchId = null;
}
function zoomToLocation(location) {
    var pt = esri.geometry.geographicToWebMercator(new esri.geometry.Point(location.coords.longitude, location.coords.latitude));
    addGraphic(pt);
    dojo.byId('tdSpeed').innerHTML = Math.ceil(((location.coords.speed) * 2.2369362920544) * 100) / 100 + " mph";
    map.centerAndZoom(pt, 18);
    (positionWatchId) ? trackLocation(pt) : null;
}
function locationError(error) {
    if (navigator.geolocation) {
        navigator.geolocation.clearWatch(positionWatchId);
        positionWatchId = null;
    }
    alert("Unable to get the location.");
}
function addPathGraphic() {
    map.getLayer(layerId).clear();
    var lineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASHDOT, new dojo.Color([255, 0, 0]), 2);
    var pathGraphic = new esri.Graphic(polyline, lineSymbol);
    map.getLayer(layerId).add(pathGraphic);
}
function trackLocation(location) {
    polyline.insertPoint(polyline.paths.length - 1, polyline.paths[polyline.paths.length - 1].length, location);
    addPathGraphic();
}
function showLocation(location) {
    var pt = esri.geometry.geographicToWebMercator(new esri.geometry.Point(location.coords.longitude, location.coords.latitude));
    (!graphic) ? addGraphic(pt) : graphic.setGeometry(pt);
    map.centerAt(pt);
}
function addGraphic(pt) {
    map.graphics.clear();
    var symbol = new esri.symbol.PictureMarkerSymbol('images/marker.png', 25, 34).setOffset(0, 17);
    graphic = new esri.Graphic(pt, symbol);
    map.graphics.add(graphic);
}
function orientationChanged() {
    setTimeout(function () {
        map.reposition(); map.resize();
        (graphic.geometry) ? map.centerAt(graphic.geometry) : null
    }, 500);
}
function loadRoute() {
    dojo.byId('divListItems').style.visibility = "visible";
    dijit.byId('routeList').destroyDescendants();
    for (var i in storageProvider.get("routeStorage")) {
        var childWidget = new dojox.mobile.ListItem({ label: i });
        dojo.connect(childWidget.domNode, "onclick", function () {
            map.getLayer(layerId).clear();
            map.getLayer(layerId).add(new esri.Graphic(storageProvider.get("routeStorage")[dijit.byId(this.id).label]));
            map.setExtent(map.getLayer(layerId).graphics[0].geometry.getExtent().expand(1.25));
            dojo.byId('divListItems').style.visibility = "hidden";
        });
        dijit.byId('routeList').addChild(childWidget);
    }
}
dojo.ready(init);