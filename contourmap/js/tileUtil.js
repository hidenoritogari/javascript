TileUtil = {};

TileUtil.tileSize = 256;

/**
* 標高タイルのURLを取得します。
*/
TileUtil.getURL = function(zoomLevel, tileX, tileY) {
  var url = "http://cyberjapandata.gsi.go.jp/xyz/dem/{z}/{x}/{y}.txt";
  url = url.replace("{z}", zoomLevel);
  url = url.replace("{x}", tileX);
  url = url.replace("{y}", tileY);
  return url;
};

/**
 * 指定した地点のピクセル座標を取得します。
 * @param {*} lat 緯度[deg]
 * @param {*} lon 経度[deg]
 * @param {*} zoomLevel ズームレベル
 */
TileUtil.getPixelCoord = function(lat, lon, zoomLevel) {
  var latRad = lat * Math.PI / 180;
  var lonRad = lon * Math.PI / 180;
  var r = 128 / Math.PI;
  worldCoordX = r * (lonRad + Math.PI);
  worldCoordY = -r / 2 * Math.log((1 + Math.sin(latRad)) / (1 - Math.sin(latRad))) + 128;
  return {
    x: Math.floor(worldCoordX * Math.pow(2, zoomLevel)),
    y: Math.floor(worldCoordY * Math.pow(2, zoomLevel))
  };
}

/**
 * 指定した地点のタイル座標を取得します。
 * @param {*} pixelCoord ピクセル座標
 */
TileUtil.getTileCoord = function(pixelCoord) {
  return {
    x: Math.floor(pixelCoord.x / TileUtil.tileSize),
    y: Math.floor(pixelCoord.y / TileUtil.tileSize)
  };
}

/**
 * 等高線地図の範囲を取得します。
 */
TileUtil.getExtent = function(minLat, minLon, maxLat, maxLon, zoomLevel) {
  var minPixelCoord = TileUtil.getPixelCoord(minLat, minLon, zoomLevel);
  var minTileCoord = TileUtil.getTileCoord(minPixelCoord);
  var maxPixelCoord = TileUtil.getPixelCoord(maxLat, maxLon, zoomLevel);
  var maxTileCoord = TileUtil.getTileCoord(maxPixelCoord);
  return {
    minPixelCoordX: Math.min(minPixelCoord.x, maxPixelCoord.x),
    minPixelCoordY: Math.min(minPixelCoord.y, maxPixelCoord.y),
    maxPixelCoordX: Math.max(minPixelCoord.x, maxPixelCoord.x),
    maxPixelCoordY: Math.max(minPixelCoord.y, maxPixelCoord.y),
    minTileCoordX: Math.min(minTileCoord.x, maxTileCoord.x),
    minTileCoordY: Math.min(minTileCoord.y, maxTileCoord.y),
    maxTileCoordX: Math.max(minTileCoord.x, maxTileCoord.x),
    maxTileCoordY: Math.max(minTileCoord.y, maxTileCoord.y)
  };
};

TileUtil.getTileData = function(zoomLevel, tileX, tileY, onDataLoad) {
  return new Promise(function(resolve, reject) {
    var req = new XMLHttpRequest();
    var url = TileUtil.getURL(zoomLevel, tileX, tileY);
    req.open("GET", url, true);
    req.onload = function() {
      if (req.status === 200) {
        var csv = req.responseText;
        onDataLoad(zoomLevel, tileX, tileY, csv);
        resolve();
      } else if (req.status === 404) {
        // 陸地が皆無の座標には標高タイルが存在しない
        resolve();
      } else {
        console.error(req.statusText);
        resolve();
      }
    };
    req.onerror = function() {
      console.error(req.statusText);
      resolve();
    };
    req.send();
  });
};

TileUtil.convertToMatrix = function(csv) {
  var data = [];
  csv.replace(/\n+$/, "").split("\n").forEach(function(row, y) {
    if (y < 0 || TileUtil.tileSize <= y) return;
    row.split(",").forEach(function(elev, x) {
      if (x < 0 || TileUtil.tileSize <= x) return;
      if (!data[x]) data[x] = [];
      data[x][y] = Math.round(elev == 'e' ? 0 : parseFloat(elev)) + 0.001;
    });
  });
  return data;
};