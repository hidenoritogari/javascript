window.onload = function() {
  var map1 = new BulkContourMap(
    39.80, 140.95, 39.90, 141.05, 12, 0, 4000, 50, 400, 400,
    function(elev) { return { strokeStyle : "#ff0000", lineWidth: 1.0 }; }
  );
  var map2 = new TileContourMap(
    39.80, 140.95, 39.90, 141.05, 12, 0, 4000, 50, 400, 400, false,
    function(elev) { return { strokeStyle : "#0000ff", lineWidth: 1.0 }; }
  );
  var map3 = new TileContourMap(
    39.80, 140.95, 39.90, 141.05, 12, 0, 4000, 50, 400, 400, true,
    function(elev) { return { r: 0x00, g: 0x00, b: 0xff, a: 0xff }; }
  );

  var drawMap = function(map, number) {
    var startTime = Date.now();
    var canvas = document.querySelector("#canvas" + number);
    map.draw(canvas)
      .then(function() {
        var img = document.querySelector("#img" + number);
        img.src = canvas.toDataURL();
      })
      .catch(function(reason) {
        var span = document.querySelector("#span" + number);
        span.innerHTML = reason;
      })
      .finally(function() {
        var span = document.querySelector("#span" + number);
        span.innerHTML = "map" + number + ": " + (Date.now() - startTime) + "[ms]";
      });
  };
  drawMap(map1, 1);
  drawMap(map2, 2);
  drawMap(map3, 3);
};
