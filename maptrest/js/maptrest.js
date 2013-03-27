dojo.require("esri.map");
dojo.require("esri.arcgis.utils");
dojo.require('esri.arcgis.Portal');
dojo.require('esri.dijit.Attribution');
dojo.require("dojox.lang.aspect");
var map;
var Maptrest = (function (basePortal, map, ko, $, undefined) {
    var esri;
	function Maptrest(esriApi) { esri = esriApi; }	
	Maptrest.prototype.mapViewModel = function (catalog, mapConfig) {
	  var self = this;
	  self.map = mapConfig;
	  self.id = mapConfig.id;
	  self.thumbnailUrl = ko.observable("url(" + mapConfig.thumbnailUrl + ")");
      self.name = ko.observable(mapConfig.title);
	  self.numViews = ko.observable(mapConfig.numViews);
	  self.numComments = ko.observable(mapConfig.numComments);
	  self.numRatings = ko.observable(mapConfig.numRatings);
	  self.avgRating = ko.observable(mapConfig.avgRating.toFixed(2));
	  self.loadMap = function() {
		if (catalog.currentMap) {
			esri.hide(dojo.byId(catalog.currentMap.id));
		}				
		if (self.map && self.map.id && dojo.byId(self.map.id)) {
			var node = dojo.byId(self.map.id);
			esri.show(node);
			catalog.currentMap = node;
			return;
		}
		esri.show(dojo.byId('loadingImg'));
		var mapDeferred = esri.arcgis.utils.createMap(self.map.id, 
		  dojo.create('div', { id: self.map.id }, dojo.byId('map')));
		mapDeferred.then(function (response) {
			catalog.currentMap = self.map = map = response.map;
			esri.hide(dojo.byId('loadingImg'));            
		},function(error){
			esri.hide(dojo.byId('loadingImg'));
			if (map) {
			  map.destroy();
			  dojo.destroy(map.container);
			}
		});
	  };
	};	
	Maptrest.prototype.mapGroupViewModel = function (mapGroup) {
		var self = this;
		self.mapGroup = mapGroup;
		self.id = mapGroup.id;
		self.thumbnailUrl = ko.observable("url(" + mapGroup.thumbnailUrl + ")");
        self.name = ko.observable(mapGroup.title);
		self.webMapsTitle = ko.observable("Web Maps in '" + self.name() + "'");	
		self.webmaps = ko.observableArray();
		self.webmapsVisible = ko.observable(false);
		self.currentMap = null;
		self.updateBoard = function (queryResponse) {
		  var webmaps = [];
		  dojo.forEach(queryResponse.results, function (item) {
			  if (item.id) {
				webmaps.push(new Maptrest.prototype.mapViewModel(self, item));
			  }
		  });
		  self.webmaps(webmaps);
		  self.webmapsVisible(true);			
		};
		self.loadWebmaps = function () {
			var params = { q: ' type: Web Map',	num: 18 };
			self.mapGroup.queryItems().then(self.updateBoard);
		};
	};
	Maptrest.prototype.portalViewModel = function () {
		var self = this;
		self.portal = new esri.arcgis.Portal(basePortal);
		self.mapGroups = ko.observableArray();
		self.selectedGroup = ko.observable();
		self.selectGroup = function (item) {
			item.loadWebmaps();
			self.selectedGroup(item);
		};
		self.loadPortal = function () {
			var params = { q: 'owner:esri AND isinvitationonly:false' };
			self.portal.queryGroups(params).then(function (groups){
				var groupItems = [];
				dojo.forEach(groups.results, function (item) {
					var group = new Maptrest.prototype.mapGroupViewModel(item);
					groupItems.push(group);
				});
				self.mapGroups(groupItems);
			});
		};
		dojo.connect(self.portal, 'onLoad', self.loadPortal);
	};
	return Maptrest;
})("http://www.arcgis.com", map, ko, jQuery);
$(function () {
	dojo.ready(function() {
		var apiModule = new Maptrest(esri);
		var vm = new apiModule.portalViewModel();
		ko.applyBindings(vm, document.getElementById("mainContent"));
    })       
});