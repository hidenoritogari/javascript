/**
 * タイルを継ぎ合わせて等高線地図を作成するオブジェクトのクラスです。
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
 * @param {*} fastmode 高速描画モード（非ベクター等高線）
 * @param {*} styleFunc 等高線標高に対して描画スタイルを返す関数（未指定の場合は既定値）
 */
var TileContourMap = function(minLat, minLon, maxLat, maxLon, zoomLevel, minElev, maxElev, elevInterval, width, height, fastmode, styleFunc) {
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
  this.fastmode = fastmode;
  this.styleFunc = styleFunc;
};

/**
 * 等高線地図の描画を完了するPromiseを返します。
 * @param {*} canvas 描画対象のCanvasオブジェクト
 */
TileContourMap.prototype.draw = function(canvas) {
  canvas.width = this.width;
  canvas.height = this.height;

  var extent = TileUtil.getExtent(this.minLat, this.minLon, this.maxLat, this.maxLon, this.zoomLevel);
  var pixelCoordWidth = extent.maxPixelCoordX - extent.minPixelCoordX;
  var pixelCoordHeight = extent.maxPixelCoordY - extent.minPixelCoordY;
  var scale = { x: canvas.width / pixelCoordWidth, y: canvas.height / pixelCoordHeight };

  var items = [];
  for (var tileX = extent.minTileCoordX; tileX <= extent.maxTileCoordX; tileX++) {
    for (var tileY = extent.minTileCoordY; tileY <= extent.maxTileCoordY; tileY++) {
      var tile = this.fastmode ?
        new FastContourTile(tileX, tileY, this.zoomLevel, this.minElev, this.maxElev, this.elevInterval, this.styleFunc) :
        new ContourTile(tileX, tileY, this.zoomLevel, this.minElev, this.maxElev, this.elevInterval, this.styleFunc);
      items.push({
        tile: tile,
        xOffset: (tileX * TileUtil.tileSize) - extent.minPixelCoordX,
        yOffset: (tileY * TileUtil.tileSize) - extent.minPixelCoordY,
        xScale: scale.x,
        yScale: scale.y
      });
    }
  }

  var promises = [];
  items.forEach(function(item) {
    var onDataLoad = function(zoomLevel, tileX, tileY, csv) {
      item.tile.draw(canvas, csv, item.xOffset, item.yOffset, item.xScale, item.yScale);
    };
    promises.push(TileUtil.getTileData(item.tile.zoomLevel, item.tile.tileX, item.tile.tileY, onDataLoad));
  });
  return Promise.all(promises);
};
