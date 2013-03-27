dojo.require("esri.map");
dojo.require("esri.layers.FeatureLayer");
dojo.require("esri.InfoWindowBase");
var timerHandle, map, countriesLayer,queryTask,query,objectIds,sfs, countryName,graph,distParams,gsvc,fl;
var clickTry,score = 0;

var maxTry = 5;

dojo.ready(init);

$('#myModal').modal('show');
function init() {

  // Create map
  map = new esri.Map("mapDiv",{
  basemap: "satellite", zoom: 3, minZoom: 3, maxZoom:5 }
  );

  sfs2= new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,
  new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
  new dojo.Color([255,255,0],1), 2),new dojo.Color([255,255,0,0.2]));
  sfs= new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,
  new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
  new dojo.Color([0,0,0],0.50), 2),new dojo.Color([255,255,0,0.1]));
  fl = new esri.layers.FeatureLayer("http://services.arcgis.com/BG6nSlhZSAWtExvp/ArcGIS/rest/services/CountryEcon/FeatureServer/0", {
    mode : esri.layers.FeatureLayer.MODE_ONDEMAND,
    outFields : ["CNTRY_NAME","OBJECTID"]
  });
  fl.setRenderer(new esri.renderer.SimpleRenderer(sfs));
  map.addLayer(fl);
  dojo.connect(map, "onClick", checkAnswer);
}
function checkAnswer(evt)
{
  if(undefined!=evt.graphic.attributes) {
    var cAttr = evt.graphic.attributes;
    var ansTitle,ansContent;
   if(cAttr.CNTRY_NAME == graph.attributes.CNTRY_NAME)
   {
    ansTitle = '<h5 class="text-success">Success!</h5>';
    ansContent= '<p>Great! You found '+cAttr.CNTRY_NAME+'</p>';
    clickTry = 0;
    //nextround
   }
   else {
     ansTitle = '<h5 class="text-error">Not good ! </h5>';
     ansContent = "You choose "+cAttr.CNTRY_NAME+
     "<br>You must find "+graph.attributes.CNTRY_NAME;
   }
   map.infoWindow.setTitle(ansTitle);
   map.infoWindow.setContent(ansContent);
  map.infoWindow.resize(200,130);
  map.infoWindow.show(evt.screenPoint,
  map.getInfoWindowAnchor(evt.screenPoint));
  }
}
function test()
{
    graph = fl.graphics[Math.floor(Math.random() * fl.graphics.length)];
    $("#countryName").html(graph.attributes["CNTRY_NAME"]);
}

