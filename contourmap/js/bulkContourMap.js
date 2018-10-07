/**
 * 等高線地図を作成するオブジェクトのクラスです。
 * @param {*} minLat 等高線地図の緯度の最小値[deg]
 * @param {*} minLon 等高線地図の経度の最小値[deg]
 * @param {*} maxLat 等高線地図の緯度の最大値[deg]
 * @param {*} maxLon 等高線地図の経度の最大値[deg]
 * @param {*} zoomLevel 使用する標高タイルのズームレベル
 * @param {*} minElev 等高線の最小標高値[m]
 * @param {*} maxElev 等高線の最大標高値[m]
 * @param {*} elevInterval 等高線の間隔[m]
 * @param {*} width 等高線地図の幅[px]
 * @param {*} height 等高線地図の高さ[px]
 * @param {*} styleFunc 等高線標高に対して描画スタイルを返す関数（未指定の場合は既定値）
 */
var BulkContourMap = function(minLat, minLon, maxLat, maxLon, zoomLevel, minElev, maxElev, elevInterval, width, height, styleFunc) {
  if (typeof styleFunc === 'undefined') {
    styleFunc = function(elev) {
      // 500m毎に等高線を濃くするスタイル
      return elev % 500 === 0 ?
        { strokeStyle : "#000000", lineWidth: 1.0 } :
        { strokeStyle : "#707070", lineWidth: 1.0 };
    };
  }

  this.minLat = minLat;
  this.minLon = minLon;
  this.maxLat = maxLat;
  this.maxLon = maxLon;
  this.zoomLevel = zoomLevel;
  this.minElev = minElev;
  this.maxElev = maxElev;
  this.elevInterval = elevInterval;
  this.width = width;
  this.height = height;
  this.styleFunc = styleFunc;
};

BulkContourMap.prototype.draw = function(canvas) {
  var self = this;
  canvas.width = self.width;
  canvas.height = self.height;

  var extent = TileUtil.getExtent(self.minLat, self.minLon, self.maxLat, self.maxLon, self.zoomLevel);
  var pixelCoordWidth = extent.maxPixelCoordX - extent.minPixelCoordX;
  var pixelCoordHeight = extent.maxPixelCoordY - extent.minPixelCoordY;
  var scale = { x: canvas.width / pixelCoordWidth, y: canvas.height / pixelCoordHeight };

  var data = [];
  var onDataLoad = function(zoomLevel, tileX, tileY, csv) {
    var xOffset = (tileX - extent.minTileCoordX) * TileUtil.tileSize;
    var yOffset = (tileY - extent.minTileCoordY) * TileUtil.tileSize;
    var tileData = TileUtil.convertToMatrix(csv);
    for (var x = 0; x < TileUtil.tileSize; x++) {
      for (var y = 0; y < TileUtil.tileSize; y++) {
        if (!data[x + xOffset]) data[x + xOffset] = [];
        data[x + xOffset][y + yOffset] = tileData[x][y];
      }
    }
  };
  var promises = [];
  for (var tileX = extent.minTileCoordX; tileX <= extent.maxTileCoordX; tileX++) {
    for (var tileY = extent.minTileCoordY; tileY <= extent.maxTileCoordY; tileY++) {
      promises.push(TileUtil.getTileData(self.zoomLevel, tileX, tileY, onDataLoad));
    }
  }
  return Promise.all(promises).then(function() {
    var clippedData = [];
    var x0 = extent.minPixelCoordX - extent.minTileCoordX * TileUtil.tileSize;
    var y0 = extent.minPixelCoordY - extent.minTileCoordY * TileUtil.tileSize;
    for (var x = 0; x < pixelCoordWidth; x++) {
      for (var y = 0; y < pixelCoordHeight; y++) {
        if (!clippedData[x]) clippedData[x] = [];
        clippedData[x][y] = data[x0 + x][y0 + y];
      }
    }
    var elevs = [];
    for (var elev = self.minElev; elev < self.maxElev; elev += self.elevInterval) {
      if (self.styleFunc(elev) == null) continue;
      elevs.push(elev);
    }
    var xTicks = [];
    for (var i = 0; i < pixelCoordWidth; i++) { xTicks.push(i); }
    var yTicks = [];
    for (var i = 0; i < pixelCoordHeight; i++) { yTicks.push(i); }
    
    var con = new Conrec();
    con.contour(clippedData, 0, pixelCoordWidth - 1, 0, pixelCoordHeight - 1, xTicks, yTicks, elevs.length, elevs);
    var contours = con.contourList();
  
    var context = canvas.getContext('2d');
    contours.forEach(function(contour) {
      var style = self.styleFunc(contour.level);
      for (var attr in style) context[attr] = style[attr];

      context.beginPath();
      contour.forEach(function(point, i) {
        var pos = { x: point.x * scale.x, y: point.y * scale.y };
        if (i == 0) {
          context.moveTo(pos.x, pos.y);
        } else {
          context.lineTo(pos.x, pos.y);
        }
      });
      context.stroke();
    });
  });
};
