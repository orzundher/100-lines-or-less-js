dojo.require("esri.map"); dojo.require("dijit.layout.BorderContainer");
dojo.require("esri.dijit.Popup"); dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.Dialog"); dojo.require("dojo.cookie");
var map, modelb,models,cnt=0, e; dojo.ready(init);
function init() {  
	var gToMove, options = { basemap: "gray", center: [-100, 50], zoom: 3 };
	var node = dojo.byId("mapCanvas"), pos = dojo.position(node, true);
	var stopEv = function(evt){evt.preventDefault();evt.stopPropagation();};
	dojo.connect(node,"dragenter",stopEv);dojo.connect(node,"dragover",stopEv);
	dojo.connect(node, "drop", handleDrop);
	map = new esri.Map("mapCanvas",options);
	dojo.connect(map, "onLoad",function(){dojo.connect(map,"onMouseMove", mm);})
	map.infoWindow.resize(500, 250);
	new BinaryAjax("images/example_geotag.jpg", function(data){
		modelb = data.binaryResponse; });
	new BinaryAjax("images/example_geotag2.jpg", function(data){
		models = data.binaryResponse; });
	function mm(evt) { 
		if (evt.shiftKey && (gToMove || evt.graphic)) {
			if (evt.graphic) gToMove = evt.graphic;
			ex=gToMove.attributes.e;if(ex.GPSLatitude||ex.GPSLongitude)return;
			map.graphics.remove(gToMove);
			gToMove.geometry = map.toMap(
				new esri.geometry.Point(evt.pageX-pos.x, evt.pageY-pos.y));
			gToMove = map.graphics.add(gToMove);
		} else {gToMove = null;} } }
function handleDrop(evt) {
	evt.preventDefault(); evt.stopPropagation();	
	var dataTrans = evt.dataTransfer, files = dataTrans.files,
		types = dataTrans.types;
	if (files && files.length > 0) {
		for (x in files) {
			var file = files[x];
			if (file.type && file.type.indexOf("image/jpeg") !== -1) {
				handleImage(file, evt.layerX, evt.layerY);}}}}
function handleImage(file, x, y) {
	var reader = new FileReader(),readerB = new FileReader();
	reader.onload = function () {
		readerB.onload = function () {
			var img = dojo.create("img");
			img.onload = function () {
				var width = img.width, height = img.height;
				var bFile = new BinaryFile(readerB.result, 0, file.size);
				var exif = EXIF.readFromBinaryFile(bFile);
				var symbol = new esri.symbol.PictureMarkerSymbol(reader.result, 
					width > 64 ? 64 : width, height > 64 ? 64 : height);
				var s1=new esri.symbol.PictureMarkerSymbol(
					'images/pin.png',90,90);
				var point, button, cl; cnt++;
				if (exif.GPSLatitude && exif.GPSLongitude) {
					lat =  fromG(exif.GPSLatitude,exif.GPSLatitudeRef);
					lon =  fromG(exif.GPSLongitude, exif.GPSLongitudeRef);
					point = new esri.geometry.Point(
						{latitude: lat,longitude:lon}); } else {
					point = map.toMap(new esri.geometry.Point(x,y));
					cl = true; }
				c='<a href="#" onclick="save('+cnt;
				c='&nbsp;'+c+')">Download image with geotag</a>'
				var t=new esri.InfoTemplate("Name: "+file.name+(cl?c:''), 
				function(g){ var b=''; for(i in g.attributes.e) 
					b += '<div class="pop" title="' + i + ' : ' + exif[i]
							+ '">' + i + ' : ' + exif[i] + '</div>'; 
					b += '<img width="470" src="' + img.src + '"/>'; return b;})
				var graph = new esri.Graphic(
					point,symbol,{f:file,e:exif,b:bFile,p:point,c:cnt},t);
				var g1; if (!cl) g1=new esri.Graphic(point,s1,{e:exif},t);	
				map.graphics.add(graph); if(g1) map.graphics.add(g1); 
			};	img.src = reader.result;
		};	readerB.readAsBinaryString(file);
	};	reader.readAsDataURL(file); }
function fromG(c,ref){return(ref=="S"||ref=="W"?-1:1)*(c[0]+c[1]/60+c[2]/3600);}
function toG(a,l1,l2){ var r=Array(4); if(a<0) {r[3]=l2; a = -a;} else r[3]=l1; 
r[0]=a;for(i=1;i<3;i++){r[i]=(r[i-1]-parseInt(r[i-1]))*60;} return r;}
function save(id) {
	for(var k=0; k<map.graphics.graphics.length; k++) 
		if (map.graphics.graphics[k].attributes.c==id) { id = k; break; }
	var bFile = map.graphics.graphics[id].attributes.b;
	point = map.graphics.graphics[id].geometry;
	var latitude = toG(point.getLatitude(),"N","S");
	var longitude = toG(point.getLongitude(),"E","W");
	var o; for (o=2;o<9999;o++) if (bFile.getShortAt(o)==57855) break;
	var offst=bFile.getShortAt(o+2,true),lend=(bFile.getStringAt(o+10,2)=="II");
	buffer = new ArrayBuffer(bFile.getLength()+200),data = new DataView(buffer);
	for (var i = 0;i<o+18;i++)	data.setUint8(i,bFile.getByteAt(i));
	data.setUint16(o+2,200+offst); model = lend ? models : modelb; 
	for (var i=38;i<234;i++) data.setUint8(o+18+i-38,model.getByteAt(i));
	for (var j=0;j < 2;j++) { 
		data.setUint32(o+18-38+j*8+186,parseInt(latitude[j]),lend);
		data.setUint32(o+18-38+j*8+210,parseInt(longitude[j]),lend);}
	data.setUint32(o+18-38+202,parseInt(latitude[2]*1000),lend);	
	data.setUint32(o+18-38+206,1000,lend);
	data.setUint32(o+18-38+226,parseInt(longitude[2]*1000),lend); 
	data.setUint32(o+18-38+230,1000,lend);
	data.setUint32(o+18-38+234,0);
	data.setUint8(o+18-38+142,latitude[3].charCodeAt(0));
	data.setUint8(o+18-38+166,longitude[3].charCodeAt(0));
	for (var i = o+18; i<bFile.getLength(); i++) 
		data.setUint8(i+200,bFile.getByteAt(i)); 
	var blob = new Blob([buffer],{type:"image/jpeg"});
	saveAs(blob, map.graphics.graphics[id].attributes.f.name);};