dojo.require("esri.map");
dojo.require("esri.dijit.Popup");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
var index, map;  
dojo.ready(init);
function init() {    
	var options = { basemap: "gray", center: [-100, 50], zoom: 3 };
	map = new esri.Map("mapCanvas",options);
 	var node = dojo.byId("mapCanvas");
	dojo.connect(node, "dragenter", function (evt) {
	  evt.preventDefault();
	});
	dojo.connect(node, "dragover", function (evt) {
	  evt.preventDefault();
	});
	dojo.connect(map, "onLoad", function() {
		dojo.connect(map, "onMouseMove", showCoordinates);
		dojo.connect(map, "onMouseDrag", showCoordinates);
	});
	dojo.connect(node, "drop", handleDrop);	
}
function showCoordinates(evt) {
	var mp = esri.geometry.webMercatorToGeographic(evt.mapPoint);
	dojo.byId("info").innerHTML = mp.x.toFixed(3) + ", " + mp.y.toFixed(3);
}
function handleDrop(evt) {
	evt.preventDefault();
	evt.stopPropagation();
	var dataTransfer = evt.dataTransfer,
		files = dataTransfer.files,
		types = dataTransfer.types;
	
	
	console.log(files);
	if (files && files.length > 0) {
		for (x in files) {
			var file = files[x];
			if (file.type && file.type.indexOf("image/") !== -1) {
				handleImage(file, evt.layerX, evt.layerY);
			}
		}
	}
}
function handleImage(file, x, y) {
	var download = dojo.byId("download");
	var reader = new FileReader(),readerB = new FileReader()
	reader.onload = function () {
		readerB.onload = function () {
			var img = dojo.create("img");
			img.onload = function () {
				var width = img.width, height = img.height;
				var bFile = new BinaryFile(readerB.result, 0, file.size);
				exif = EXIF.readFromBinaryFile(bFile);
				var symbol = new esri.symbol.PictureMarkerSymbol(reader.result, width > 64 ? 64 : width, height > 64 ? 64 : height);
				var point;
				if (exif.GPSLatitude && exif.GPSLongitude) {
					lat =  exif.GPSLatitude[0] + exif.GPSLatitude[1]/60 + exif.GPSLatitude[2]/3600;
					if (exif.GPSLatitudeRef == "S") lat = -lat;
					lon =  exif.GPSLongitude[0] + exif.GPSLongitude[1]/60 + exif.GPSLongitude[2]/3600;
					if (exif.GPSLongitudeRef == "W") lon = -lon;
					point = new esri.geometry.Point({   latitude: lat,   longitude: lon} );
				} else {
					point = map.toMap(new esri.geometry.Point(x,y));
					dojo.connect(download, "click", function (evt) {
						buffer = new ArrayBuffer(bFile.getLength()+10), data = new DataView(buffer)
						for (var i = 0; i<4; i++) data.setUint8(i,bFile.getByteAt(i)); 
						var offset = bFile.getShortAt(4,true);
						data.setUint16(4,offset + 10)
						console.log(offset); //calculate bigendian!
						for (var i = 6; i<20; i++) data.setUint8(i,bFile.getByteAt(i)); 
						for (var i = 20; i<30; i++) data.setUint8(i,0); 
						for (var i = 20; i<bFile.getLength(); i++) data.setUint8(i+10,bFile.getByteAt(i)); 
						
						var blob = new Blob([buffer],{type:"image/jpeg"});
						saveAs(blob, "test.jpg");
					});
				}
				var template = new esri.dijit.PopupTemplate({
					title: "aaa",
					description:"bbb"
				});
				var graphic = new esri.Graphic(point, symbol, exif, template);
				new dojo.dnd.Moveable(graphic.getDojoShape().getNode());
				map.graphics.add(graphic);
			};
			img.src = reader.result;
		};
		readerB.readAsBinaryString(file);
	};
	reader.readAsDataURL(file);
}



