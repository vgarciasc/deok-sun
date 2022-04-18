// var $radios = $('input[data-sync]');
// $radios.change(function(e) {
//     $radios.filter('[data-sync="' + $(this).attr('data-sync') + '"]')
//            .prop('checked', true);
//     return e
// });

String.prototype.to_ascii = function() {
	return this.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
};

String.prototype.capitalize = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
};

function editDistance(s1, s2) {
  s1 = s1.toLowerCase().to_ascii();
  s2 = s2.toLowerCase().to_ascii();

  var costs = new Array();
  for (var i = 0; i <= s1.length; i++) {
    var lastValue = i;
    for (var j = 0; j <= s2.length; j++) {
      if (i == 0)
        costs[j] = j;
      else {
        if (j > 0) {
          var newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue),
              costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0)
      costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

const argFact = (compareFn) => (array) => array.map((el, idx) => [el, idx]).reduce(compareFn)[1]

const argmax = argFact((min, el) => (el[0] > min[0] ? el : min))
const argmin = argFact((max, el) => (el[0] < max[0] ? el : max))