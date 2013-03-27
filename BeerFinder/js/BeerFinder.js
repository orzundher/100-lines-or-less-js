dojo.require("esri.map");
dojo.require("esri.graphic");
dojo.require("esri.symbol");
dojo.require("esri.dijit.Geocoder");
dojo.require("esri.InfoWindowBase");
var symbol, map, lt,lg, handle,locSymbol,locPoint;
var baseUrl = "http://gis.cedricdespierre.fr/";

dojo.ready(init);
function init() {
$('#welcome').modal('show')
symbol = new esri.symbol.PictureMarkerSymbol({"angle":0,"type":"esriPMS",
"url":"http://static.arcgis.com/images/Symbols/PeoplePlaces/Bar.png",
"contentType":"image/png","width":24,"height":24,"xoffset":0,"yoffset":0});
locSymbol = new esri.symbol.PictureMarkerSymbol({"angle":0,"type":"esriPMS",
"url":"http://static.arcgis.com/images/Symbols/Basic/RedFlag.png",
"contentType":"image/png","width":24,"height":24,"xoffset":12,"yoffset":12});
  map = new esri.Map("mapDiv", {
    basemap : "streets",
    zoom : 4,
    center : [-89, 35]
  });
  var geocoder = new esri.dijit.Geocoder({
    autoNavigate: false,
    maxLocations: 1,
    map: map,
    arcgisGeocoder: {placeholder: "Find a place"}
  }, 'search');
  geocoder.startup();
  dojo.connect(geocoder, "onFindResults", function(response) {
    dojo.disconnect(handle);
    getBreweries(response.results[0].feature.geometry);
  });
}

function locClick() {
$('#locMap').button('loading').attr('disabled', 'disabled');
var handleLoc = dojo.connect(map,'onClick',function(evt) {
  getBreweries(evt.mapPoint);
  dojo.disconnect(handle);
  dojo.disconnect(handleLoc);
  $('#locMap').button('reset').removeAttr('disabled'); 
  });
}
function getBreweries(geometry) {
map.graphics.clear();
map.infoWindow.hide();
locPoint = new esri.Graphic(geometry, locSymbol);
lt = geometry.getLatitude();
lg = geometry.getLongitude();
$.get(baseUrl+"BeerMe.php?lat="+lt+"&lng="+lg+"&radius=70", function(data) {
var test = JSON.parse(data);
$('#resultsText').html('<p>'+test.totalResults+' breweries found!</p>');
if(0<test.totalResults) {addGraph(test);$("#resScroll").show()}
else { $("#resScroll").hide()}});
}

function addGraph(test) {
$("#resultsTable").html("");
for (var i = 0, len = test.data.length; i < len; i++) {
var point = 
new esri.geometry.Point(test.data[i].longitude,test.data[i].latitude);
map.graphics.add(new esri.Graphic(point, symbol,test.data[i]));
$('#resultsTable').append('<tr><td><p><i class="icon-globe"></i> '
+test.data[i].brewery.name + ' <small><em>(Distance: '+test.data[i].distance
+' mi.)</em></small></p></tr></td>');}
  map.graphics.redraw();
  handle = dojo.connect(map.graphics, "onClick", onClick);
  $("#resultsTable td").click(function(){
  var graphId = $(this).parent()[0].rowIndex;
  var fakeEvt = [];
  fakeEvt.graphic = map.graphics.graphics[graphId];
  fakeEvt.screenPoint = fakeEvt.graphic.geometry;
  map.centerAt(fakeEvt.screenPoint);
  onClick(fakeEvt);
});
if (1 == map.graphics.graphics.length) {
  map.centerAt(map.graphics.graphics[0].geometry) } 
else if (1 < map.graphics.graphics.length){
  map.setExtent((esri.graphicsExtent(map.graphics.graphics))); }
  map.graphics.add(locPoint);
}

function onClick(evt) {
if(null != evt.graphic.attributes) {
 var bid = evt.graphic.attributes.breweryId;
 map.infoWindow.setTitle("<h5>"+evt.graphic.attributes.brewery.name+"</h5>");
 map.infoWindow.setContent(evt.graphic.attributes.desc);
 $.get(baseUrl+"Beer2Beer.php?bid="+bid, function(data) {
    var test = JSON.parse(data);
    $('#tab3').html(test.BeerDesc)
  });
map.infoWindow.resize(380,250);
map.infoWindow.show(evt.screenPoint,
map.getInfoWindowAnchor(evt.screenPoint));}
}