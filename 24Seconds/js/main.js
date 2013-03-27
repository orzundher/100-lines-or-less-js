dojo.require("esri.map");
dojo.require("esri.tasks.query");
dojo.require("esri.layers.FeatureLayer");
dojo.require("esri.layers.graphics");
var map, stsLayer, grpLayer, clock, symbol, selList, bombPlaceIndex;
dojo.ready(function () {
	var options = { basemap: "national-geographic", center: [-40, 10], zoom: 3 };
	map = new esri.Map("map", options);
	dojo.connect(map, "onLoad", mapLoad);
	$(".start").click(function () {
		startGame();
	});
});
function startGame() {
	$("#worldLife").text(5);
	$("#savedPlaces").text(0);
	$('#remainingBombs').text(25);
	$('#exploedBombs').text(0);
	var weight1 = 0, weight2 = 0, weight3 = 0, index = 0, capitalIndex;
	selList = []; bombPlaceIndex = 25;
	while (selList.length < 25) {
		capitalIndex = Math.floor((Math.random() * 222) + 1);
		switch (grpLayer.graphics[capitalIndex].attributes["WEIGHT"]) {
			case 1: if (weight1 < 11) {
						selList[index] = grpLayer.graphics[capitalIndex]; index++; weight1++;
			        } break;
			case 2: if (weight2 < 11) {
						selList[index] = grpLayer.graphics[capitalIndex]; index++; weight2++;
				     } break;
			case 3: if (weight3 < 3) {
						selList[index] = grpLayer.graphics[capitalIndex]; index++; weight3++;
					} break;
		}
	}
	nextTarget();
}
function nextTarget() {
	$('#remainingBombs').text(parseInt($('#remainingBombs').text()) - 1);
	bombPlaceIndex--;
	$(".tip").text("");
	if ($("#worldLife").text() == 0 || $("#remainingBombs").text() == 0) {
		grpLayer.refresh();
		clearInterval(clock);
		$($("#worldLife").text() == 0 ? "#modal_endgame" : "#modal_win").reveal({ 
			closeonbackgroundclick: false, dismissmodalclass: 'start'
		}); return;
	}
	startClock();
}
function mapLoad() {
	$('#modal_tela1').reveal({ closeonbackgroundclick: false,
		dismissmodalclass: 'next' });
	$("#btnNext").click(function () {
		$('#modal_tela2').reveal({ closeonbackgroundclick: false,
			dismissmodalclass: 'next' });
	});
	$("#btnNext2").click(function () {
		$('#modal_tela3').reveal({ closeonbackgroundclick: false,
			dismissmodalclass: 'start' });
	});
	grpLayer = new esri.layers.GraphicsLayer({ visible: true });
	stsLayer = new esri.layers.FeatureLayer($("#serviceUrl").val(),
   		{ id: "worldCapitals", outFields: ["*"],
		 mode: esri.layers.FeatureLayer.MODE_SNAPSHOT });
	grpLayer = stsLayer;
	map.addLayer(stsLayer);
	dojo.connect(stsLayer, "onClick", function (evt) {
		if (evt.graphic.attributes.CAPITAL ==
				selList[bombPlaceIndex - 1].attributes["CAPITAL"]) {
			symbol = new esri.symbol.PictureMarkerSymbol($("#shield").val(), 25, 25);
			evt.graphic.setSymbol(symbol);
			$("#savedPlaces").text(parseInt($("#savedPlaces").text()) + 1);
			nextTarget();
		}
	});
}
function setTip(tip, attr) {
	$("#tip" + tip).text(selList[bombPlaceIndex - 1].attributes[attr]);
}
function startClock() {
	setTip(1, "CAPITAL");
	clearInterval(clock);
	$("#clock").text("24");
	clock = self.setInterval(function () {
		$("#clock").text($("#clock").text() - 1);
		if ($("#clock").text() == 0) {
			$("#worldLife").text($("#worldLife").text() - 1);
			symbol = new esri.symbol.PictureMarkerSymbol($('#burn').val(), 25, 25);
			selList[bombPlaceIndex - 1].setSymbol(symbol);
			$('#exploedBombs').text(parseInt($('#exploedBombs').text()) + 1);
			nextTarget();
		}
		if ($("#clock").text() == 20) { setTip(2, "CAP_POP"); }
		if ($("#clock").text() == 16) { setTip(3, "CONT"); }
		if ($("#clock").text() == 12) { setTip(4, "LANG"); }
		if ($("#clock").text() == 6) { setTip(5, "COUNTRY"); }
	}, 1000);
}