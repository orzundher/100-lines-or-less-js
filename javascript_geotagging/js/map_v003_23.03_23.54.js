dojo.require("esri.map");
dojo.require("esri.dijit.Popup");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
var map; dojo.ready(init);
function init() {  
	var gToMove, options = { basemap: "gray", center: [-100, 50], zoom: 3 };
	var node = dojo.byId("mapCanvas"), pos = dojo.position(node, true);
	dojo.connect(node, "dragenter", function (evt) { evt.preventDefault(); });
	dojo.connect(node, "dragover", function (evt) { evt.preventDefault(); });
	dojo.connect(node, "drop", handleDrop);
	map = new esri.Map("mapCanvas",options);
	var readerH = new FileReader();
	
	dojo.connect(map, "onLoad",function(){dojo.connect(map,"onMouseMove", mm);})
	map.infoWindow.resize(500, 250);
	function mm(evt) { 
		if (evt.ctrlKey && (gToMove || evt.graphic)) {
			if (evt.graphic) gToMove = evt.graphic;
			map.graphics.remove(gToMove);
			gToMove.geometry = map.toMap(
				new esri.geometry.Point(evt.pageX-pos.x, evt.pageY-pos.y));
			gToMove = map.graphics.add(gToMove);
		} else {gToMove = null;} }	
}
function handleDrop(evt) {
	evt.preventDefault(); evt.stopPropagation();
	var dataTransfer = evt.dataTransfer, files = dataTransfer.files,
		types = dataTransfer.types;
	if (files && files.length > 0) {
		for (x in files) {
			var file = files[x];
			if (file.type && file.type.indexOf("image/jpeg") !== -1) {
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
				var symbol = new esri.symbol.PictureMarkerSymbol(reader.result, 
					width > 64 ? 64 : width, height > 64 ? 64 : height);
				var point;
				if (exif.GPSLatitude && exif.GPSLongitude) {
					lat =  fromG(exif.GPSLatitude,exif.GPSLatitudeRef);
					lon =  fromG(exif.GPSLongitude, exif.GPSLongitudeRef);
					point = new esri.geometry.Point(
						{latitude: lat,longitude:lon});
				} else {
					point = map.toMap(new esri.geometry.Point(x,y));
					dojo.connect(download, "click", function (evt) {
						buffer = new ArrayBuffer(bFile.getLength()+12), 
							data = new DataView(buffer)
						
						
						for (var i = 0; i<4; i++) 
							data.setUint8(i,bFile.getByteAt(i)); 
						var offset = bFile.getShortAt(4,true);
						data.setUint16(4,offset + 12)
						console.log(offset); //calculate bigendian!
						for (var i = 6;i<20;i++) 
							data.setUint8(i,bFile.getByteAt(i)); 
						gps = array()	
						for (var i = 20; i<32; i++) data.setUint8(i,gps); 
						for (var i = 20; i<bFile.getLength(); i++) 
							data.setUint8(i+12,bFile.getByteAt(i)); 
						var blob = new Blob([buffer],{type:"image/jpeg"});
						saveAs(blob, "test.jpg");
					});
				}
				var graphic = new esri.Graphic(point, symbol, {f: file,e: exif}, 
						new esri.InfoTemplate("Name: " + file.name, function(g){
					var b=''; for(i in exif) 
						b += '<div class="pop" title="' + i + ' : ' + exif[i]
							+ '">' + i + ' : ' + exif[i] + '</div>'; 
					b += '<img width="470" src="' + img.src + '"/>'; return b;
				}));
				map.graphics.add(graphic);
			};
			img.src = reader.result;
		};
		readerB.readAsBinaryString(file);
	};
	reader.readAsDataURL(file);
}
function fromG(c,ref){return(ref=="S"||ref=="W"?-1:1)*(c[0]+c[1]/60+c[2]/3600)};



