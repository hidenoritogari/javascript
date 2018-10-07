/**
* 国土地理院の標高タイルデータを用いて等高線タイルを描画するオブジェクトのクラスです。
* @param {*} tileX 標高タイルのX座標
* @param {*} tileY 標高タイルのY座標
* @param {*} zoomLevel ズームレベル
* @param {*} minElev 等高線の最小標高値[m]
* @param {*} maxElev 等高線の最大標高値[m]
* @param {*} elevInterval 等高線の標高間隔[m]
* @param {*} styleFunc 等高線標高に対して描画スタイルを返す関数
*/
var ContourTile = function(tileX, tileY, zoomLevel, minElev, maxElev, elevInterval, styleFunc) {
  if (typeof styleFunc === 'undefined') {
    styleFunc = function(elev) {
      // 500m毎に等高線を濃くするスタイル
      return elev % 500 === 0 ?
        { strokeStyle : "#000000", lineWidth: 1.0 } :
        { strokeStyle : "#707070", lineWidth: 1.0 };
    };
  }
  
  this.tileX = tileX;
  this.tileY = tileY;
  this.zoomLevel = zoomLevel;
  this.minElev = minElev;
  this.maxElev = maxElev;
  this.elevInterval = elevInterval;
  this.styleFunc = styleFunc;
};

/**
* 等高線データを作成します。
* @param {*} csv テキスト標高タイルの内容（256×256のCSV）
*/
ContourTile.prototype.createContours = function(csv) {
  var data = TileUtil.convertToMatrix(csv);
  var elevs = [];
  for (var elev = this.minElev; elev < this.maxElev; elev += this.elevInterval) {
    if (this.styleFunc(elev) == null) continue;
    elevs.push(elev);
  }
  var ticks = [];
  for (var i = 0; i < TileUtil.tileSize; i++) {
    ticks.push(TileUtil.tileSize * i / (TileUtil.tileSize - 1));
  }
  var con = new Conrec();
  con.contour(data, 0, ticks.length - 1, 0, ticks.length - 1, ticks, ticks, elevs.length, elevs);
  return con.contourList();
};

/**
* 等高線を描画します。
* @param {*} canvas 描画先のCanvasオブジェクト
* @param {*} csv 標高タイルのCSV
* @param {*} xOffset 描画時のX座標オフセット値（未指定の場合は0）
* @param {*} yOffset 描画時のY座標オフセット値（未指定の場合は0）
* @param {*} xScale 描画時のX座標スケール（未指定の場合は1.0）
* @param {*} yScale 描画時のY座標スケール（未指定の場合は1.0）
*/
ContourTile.prototype.draw = function(canvas, csv, xOffset, yOffset, xScale, yScale) {
  if (typeof xOffset === 'undefined') xOffset = 0;
  if (typeof yOffset === 'undefined') yOffset = 0;
  if (typeof xScale === 'undefined') xOffset = 1.0;
  if (typeof yScale === 'undefined') xOffset = 1.0;

  var contours = this.createContours(csv);

  var context = canvas.getContext('2d');
  var z = this.zoomLevel;
  var styleFunc = this.styleFunc;
  contours.forEach(function(contour) {
    var style = styleFunc(contour.level);
    for (var attr in style) context[attr] = style[attr];

    context.beginPath();
    contour.forEach(function(point, i) {
      var pos = { x: (point.x + xOffset) * xScale, y: (point.y + yOffset) * yScale };
      if (i == 0) {
        context.moveTo(pos.x, pos.y);
      } else {
        context.lineTo(pos.x, pos.y);
      }
    });
    context.stroke();
  });
};
