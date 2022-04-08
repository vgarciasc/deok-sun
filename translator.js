let data = [];
let headers = [];

$.get("data/kr-surnames.csv", function(csv) {
	data = csv.split("\n").map((d) => d.split(";"));
	headers = data.shift();
	$("#main-container").text(data.map((d) => d[1]));
});