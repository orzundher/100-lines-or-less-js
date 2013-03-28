require(['dojo/dom', 'dojo/_base/connect', 'esri/layers/FeatureLayer',
    'dijit/Menu', 'dijit/MenuItem', 'dijit/form/ComboBox', 'dojo/store/Memory'], 
    function(dom, con, flayer, Menu, Item, ComboBox, Memory){
        var map = new esri.Map('map',{
            basemap: "streets", center:[9.9468, 51.5563],zoom:19
        });
        map.addLayer(new esri.layers.ArcGISTiledMapServiceLayer(
            'http://134.76.21.100/arcgis/rest/services/KBase/MapServer'
        ));
        var cBox, selBuilding, selRoom; 
        dojo.connect(map, 'onLoad', function(){
            buildings = new flayer(
                'http://134.76.21.100/arcgis/rest/services/Koma/FeatureServer/1',
                { mode: esri.layers.FeatureLayer.MODE_SELECTION, outFields: ["*"]
            });
            rooms = new flayer(
                'http://134.76.21.100/arcgis/rest/services/Koma/FeatureServer/0',
                { mode: esri.layers.FeatureLayer.MODE_SELECTION, outFields: ["*"]
            });
            map.addLayers([buildings, rooms]);
            map.resize();
        });
        dojo.connect(map, 'onClick', function(evt) {
            var bQuery = new esri.tasks.Query();
            bQuery.geometry = evt.mapPoint;
            buildings.selectFeatures(bQuery, esri.layers.FeatureLayer.SELECTION_NEW,
            function(evt){
                if (!evt[0]){
                    rooms.clearSelection();
                    dom.byId("bName").innerHTML = "NONE SELECTED";
                    dom.byId("bCombo").innerHTML = dom.byId("rDescr").innerHTML = "";
                    selRoom = "";
                    selBuilding = "";
                }
                else if (evt[0].attributes.piz != selBuilding){
                    selBuilding = evt[0].attributes.piz;
                    dom.byId("bName").innerHTML = evt[0].attributes.geb_bez;
                    var fStore = new Memory();
                    for (i = evt[0].attributes.og; i > 0; i -= 1) {
                        fStore.add({ name: "OG-" + i, id: "OG-" + i });
                    }
                    fStore.add({ name: "EG", id: "EG" });
                    for (i = 1; i <= evt[0].attributes.ug; i += 1) {
                        fStore.add({ name: "UG-" + i, id: "UG-" + i });
                    }
                    cBox = new ComboBox({
                        value: "EG",
                        store: fStore,
                        onChange: setfloor
                    });
                    dom.byId("bCombo").innerHTML =
                    "<div id='cb' class='lines'>Select floor: </div>";
                    cBox.placeAt("cb");
                    setfloor("EG");
                }
            });
        });
	dojo.connect(map, 'onUpdateStart', function () {
            esri.show(dojo.byId("loadingImg"));
	});
	dojo.connect(map, 'onUpdateEnd', function () {
		esri.hide(dojo.byId("loadingImg"));
	});
        dojo.connect(map, 'onMouseMove', function(evt) {
            if (evt.graphic) {
                if (typeof evt.graphic.attributes.ident != 'undefined') {
                    if (selRoom) {
                        selRoom.setSymbol(evt.graphic.symbol);
                    }
                    evt.graphic.setSymbol(new esri.symbol.SimpleFillSymbol(
                        esri.symbol.SimpleFillSymbol.STYLE_SOLID,
                        new esri.symbol.CartographicLineSymbol(
                        esri.symbol.CartographicLineSymbol.STYLE_SOLID,
                        new dojo.Color([255, 0, 0]), 2, esri.symbol.CartographicLineSymbol.CAP_ROUND,
                        esri.symbol.CartographicLineSymbol.JOIN_ROUND),
                        new dojo.Color([255, 0, 0, 0.5])));
                    selRoom = evt.graphic;
                    dom.byId("rDescr").innerHTML =
                    	"<div class='lines'>Room number.: " + evt.graphic.attributes.raumnr + 
                    	"</div><div class='lines'>Room name: " + evt.graphic.attributes.raumname +
                    	"</div><div class='lines'>Person: " + evt.graphic.attributes.personen +
                    	"</div>";
                }
            }
        });
        function setfloor(label){
            var fQuery = new esri.tasks.Query();
            fQuery.where = "etage = '" + label + "' AND gebid = '" + selBuilding + "'";
            rooms.selectFeatures(fQuery, esri.layers.FeatureLayer.SELECTION_NEW,
            function(){cb.value=label;});
        }
});