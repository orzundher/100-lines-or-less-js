dojo.require("esri.map");
dojo.require("esri.tasks.query");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dojox/dgauges/components/grey/CircularLinearGauge");
var map, busLayer, osr, liveTimerID, nextTimeRefresh, e;
var secsRefresh = 20, secRem = 20;
function init() {
	osr = new esri.SpatialReference({wkid:102100});
	e = new esri.geometry.Extent(-13432400,5869400,-13401900,5881800,osr);
	mapParams = {extent: e,basemap:"topo"};
	map = new esri.Map("map",mapParams);
	map.infoWindow.resize(120,60);
	dojo.connect(map, "onLoad", function() {
		busLayer = new esri.layers.GraphicsLayer();
		dojo.connect(busLayer, "onMouseMove", function(evt) {
			var g = evt.graphic;
			map.infoWindow.setContent(g.getContent());
			map.infoWindow.setTitle(g.getTitle());
			map.infoWindow.fixedAnchor=esri.dijit.InfoWindow.ANCHOR_UPPERRIGHT;
			map.infoWindow.show(evt.screenPoint,
			map.getInfoWindowAnchor(evt.screenPoint));
		});
		dojo.connect(busLayer,"onMouseOut",function(){map.infoWindow.hide();});
		map.addLayer(busLayer);
		queryBuses();
	});
}
function queryBuses() {
	var busURL =
	'http://gis.yakimawa.gov/arcgis101/rest/services/AVL/CityAVL/MapServer/3';
	var busQueryTask = new esri.tasks.QueryTask(busURL);
	var busQuery = new esri.tasks.Query();
	busQuery.returnGeometry = true;
	busQuery.outFields = ["UnitID,DisplayID,Name,LocalDate,Speed,Heading"];
	busQuery.outSpatialReference = osr;
	busQuery.geometry = e;
	var dayAgo = dojo.date.add(new Date(),"hour",-24);
	var dp = {datePattern: "MM/dd/yyyy", timePattern: "HH:mm:ss"};
	busQuery.where = "LocalDate > '"+dojo.date.locale.format(dayAgo, dp)+"'";
	busQuery.orderByFields = ["Speed DESC, DisplayID ASC"];
	busQueryTask.execute(busQuery,getBusQueryResults);
}
function getBusQueryResults(r) {
	busLayer.clear();
	var i = r.features.length;
	while (i--) {
		var busPlace = i;
		var bus = r.features[i].attributes;
		var busTitle = "Bus " + bus.DisplayID;
		var busText = stringHeading(bus.Heading) + "@" + bus.Speed + "mph";
		if (i > 2){
			busPlace = "X";
		} else {
			dijit.byId("g"+i).set("value", bus.Speed);
			dijit.byId("g"+i).refreshRendering();
			dojo.byId("bus"+i).innerHTML = busTitle + " " + busText;
		};
		var busSym = new esri.symbol.PictureMarkerSymbol({
			"angle": bus.Heading,"xoffset": 0,"yoffset": 0,
			"url": "images/bus" + busPlace + ".png",
			"contentType": "image/png",
			"width": 24, "height": 24
			});
		var busIT = new esri.InfoTemplate(busTitle, busText);
		var busGeo = r.features[i].geometry;
		var busGraphic = new esri.Graphic(busGeo,busSym,bus,busIT);
		busLayer.add(busGraphic);
	}
	timeNow = new Date();
	nextTimeRefresh = timeNow.getTime() + (secsRefresh * 1000);
	refreshLiveAVL();
}
function refreshLiveAVL() {
	timeNow = new Date();
	secRem = Math.round((nextTimeRefresh - timeNow.getTime()) / 1000);
	if (secRem <= 0) {
		nextTimeRefresh = timeNow.getTime() + (secsRefresh * 1000);
		secRem = secsRefresh;
		queryBuses();
	}
	dojo.byId("refreshIN").innerHTML = "Refreshing in " +secRem + " seconds";
	if (secRem > 0) {
		liveTimerID = setTimeout("refreshLiveAVL()",1000);
	}
}
function stringHeading(heading){
	if (heading < 23) { return "N";
	} else if (heading < 68) { return "NE";
	} else if (heading < 113) { return "E";
	} else if (heading < 158) { return "SE";
	} else if (heading < 203) { return "S";
	} else if (heading < 248) { return "SW";
	} else if (heading < 293) { return "W";
	} else if (heading < 338) { return "NW";
	} else { return "N";
	}
}
dojo.addOnLoad(init);