/**
* 国土地理院の標高タイルデータを用いて等高線タイルを描画するオブジェクトのクラスです。
* @param {*} tileX 標高タイルのX座標
* @param {*} tileY 標高タイルのY座標
* @param {*} zoomLevel ズームレベル
* @param {*} minElev 等高線の最小標高値[m]
* @param {*} maxElev 等高線の最大標高値[m]
* @param {*} elevInterval 等高線の標高間隔[m]
* @param {*} styleFunc 等高線標高に対して描画スタイルを返す関数（未指定の場合は既定値）
*/
var FastContourTile = function(tileX, tileY, zoomLevel, minElev, maxElev, elevInterval, styleFunc) {
  if (typeof styleFunc === 'undefined') {
    // 500m毎に等高線を濃くするスタイル
    var defaultStyleFunc = function(elev) {
      return elev % 500 === 0 ?
        { r: 0x00, g: 0x00, b: 0x00, a: 0xff } :
        { r: 0x00, g: 0x00, b: 0x00, a: 0x70 };
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
* 等高線を描画します。
* @param {*} canvas 描画先のCanvasオブジェクト
* @param {*} xOffset 描画時のX座標オフセット値（未指定の場合は0）
* @param {*} yOffset 描画時のY座標オフセット値（未指定の場合は0）
* @param {*} xScale 描画時のX座標スケール（未指定の場合は1.0）
* @param {*} yScale 描画時のY座標スケール（未指定の場合は1.0）
*/
FastContourTile.prototype.draw = function(canvas, csv, xOffset, yOffset, xScale, yScale) {
  if (typeof xOffset === 'undefined') xOffset = 0;
  if (typeof yOffset === 'undefined') yOffset = 0;
  if (typeof xScale === 'undefined') xOffset = 1.0;
  if (typeof yScale === 'undefined') xOffset = 1.0;

  var elevInterval = this.elevInterval;
  var dem = csv.split(/[,\n]/).map(function(v) {
    return Math.floor(parseFloat(v) / elevInterval);
  });

  var ctx = canvas.getContext("2d");
  var img = ctx.createImageData(0x0100, 0x0100);
  for (var i = 0; i <= 0xffff; i++) {
    if ((i & 0x00ff) === 0x00ff || (i & 0xff00) === 0xff00) continue;
    if (dem[i] !== dem[i + 1] || dem[i] !== dem[i + 0x0100] || dem[i] !== dem[i + 0x101]) {
      var style = this.styleFunc(dem[i] * elevInterval);
      img.data[i * 4 + 0] = style.r == undefined ? 0x00 : style.r;
      img.data[i * 4 + 1] = style.g == undefined ? 0x00 : style.g;
      img.data[i * 4 + 2] = style.b == undefined ? 0x00 : style.b;
      img.data[i * 4 + 3] = style.a == undefined ? 0xff : style.a;
    }
  }
  createImageBitmap(img)
    .then(function(imgBmp) {
      ctx.drawImage(imgBmp, xOffset * xScale, yOffset * yScale, 256 * xScale, 256 * yScale);
    });
};
