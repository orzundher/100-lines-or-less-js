dojo.require("esri.map");

dojo.require("esri.arcgis.utils");

var map;

function init() {
 
  var mapDeferred = esri.arcgis.utils.createMap("717b5e8125334bae9c15886cca511264", "map");

  mapDeferred.then(function(response) {
        map = response.map;
 });

}


dojo.ready(init);