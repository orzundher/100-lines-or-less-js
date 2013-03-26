//80xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
dojo.require("esri.map");
dojo.require("esri.layers.FeatureLayer");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("esri.layers.graphics");
dojo.ready(init);
var huell, regions, map, dialog, link, tooltip;	
function init() {
  map = new esri.Map("map",{
	basemap:"national-geographic", center:[-120.55,37.75], zoom:6,
	sliderStyle:"small", minZoom:6});
  huell = new esri.layers.FeatureLayer("http://mappingideas.sdsu.edu/" + 
		"ArcGIS/rest/services/Health/whereshuell/MapServer/0",{
	mode: esri.layers.FeatureLayer.MODE_ONDEMAND, outFields: ["*"]});
  regions = new esri.layers.FeatureLayer("http://mappingideas.sdsu.edu/" +
		"ArcGIS/rest/services/Health/whereshuell/MapServer/1",{
	mode: esri.layers.FeatureLayer.MODE_SNAPSHOT});
  boundary = new esri.layers.FeatureLayer("http://mappingideas.sdsu.edu/" +
		"ArcGIS/rest/services/Health/whereshuell/MapServer/2",{
	mode: esri.layers.FeatureLayer.MODE_ONDEMAND});
  regions.setDefinitionExpression("Region= + 'none'");
  map.addLayers([regions, boundary, huell]);   
  dojo.connect(huell, "onMouseOver", function(evt) {
	var hSymbol = new esri.symbol.PictureMarkerSymbol(
		'images/clippedHuell.gif', 45, 60);
	var highlightGraphic = new esri.Graphic(evt.graphic.geometry,hSymbol);
	map.graphics.add(highlightGraphic);
	var t = "<div class='infoBold'>${PopupInfo}</div>"
	t += "<div class='info'>${Name}, CA - ${Region}</div>"
	t += "<div class='info'>${moreInfo}</div>"
	var content = esri.substitute(evt.graphic.attributes,t);
	document.getElementById("episodeInfo").innerHTML = content;
	map.setMapCursor("pointer");
	var d = esri.substitute(evt.graphic.attributes,"${PopupInfo}");
	templink = "${Link}";
	link = esri.substitute(evt.graphic.attributes,templink);
  });
  dojo.connect(map, "onLoad", function(){
	map.graphics.enableMouseEvents();
	dojo.connect(map.graphics,"onMouseOut",closeDialog);
	dojo.connect(map.graphics, "onClick", function(evt) {
	  window.open(link, '_blank');
      window.focus();
	});
  });
  dojo.connect(map, "onExtentChange", function(
	extent, delta, outLevelChange, outLod){
	if(outLod.level<7){
	  var defaultSymbol = new esri.symbol.PictureMarkerSymbol(
		'images/clippedHuell.gif', 13, 18);
	}
	else if(outLod.level==7){
	  var defaultSymbol = new esri.symbol.PictureMarkerSymbol(
		'images/clippedHuell.gif', 16, 21);
	}
	else{
	  var defaultSymbol = new esri.symbol.PictureMarkerSymbol(
		'images/clippedHuell.gif', 20, 25);
	}
	var renderer = new esri.renderer.ClassBreaksRenderer(defaultSymbol);
	huell.setRenderer(renderer);
	closeDialog();
  });
  dojo.connect(regions, "onUpdateEnd", function(evt) {
	var featureExtent = regions.graphics[0].geometry.getExtent();
	map.setExtent(featureExtent.expand(1.5));
  });
}
function closeDialog() {
  map.graphics.clear();
  document.getElementById("episodeInfo").innerHTML = 
	"Hover over Huell to view episode information." + 
	"<br/><br/>Click on Huell to link to video.";
  map.setMapCursor("default");
}	
function changeRegion(id){
  regions.setDefinitionExpression("Region= + '" + id + "'");
  regions.show();
}
function highlightImage(id){
  document.getElementById("caRegions").setAttribute(
	"src", "images/caRegions_" + id + ".jpg");
}	  	  
function originalImage(){
  document.getElementById("caRegions").setAttribute(
	"src", "images/caRegions.jpg");
}
function close() {
  document.getElementById("overlay").style.visibility = 'hidden';
}		
