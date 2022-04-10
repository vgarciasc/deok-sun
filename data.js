// let kr_surnames = [
// 	{surname: "Kim", incidence: 11028664, freq: 0.215},
// 	{surname: "Lee", incidence: 7531600, freq: 0.147},
// 	{surname: "Park", incidence: 4289612, freq: 0.083},
// 	{surname: "Chong", incidence: 2450659, freq: 0.047},
// 	{surname: "Choe", incidence: 2399473, freq: 0.046},
// 	{surname: "Cho", incidence: 1500937, freq: 0.029},
// ]

// let br_surnames = [
// 	{surname: "da Silva", incidence: 11028664, freq: 0.077},
// 	{surname: "dos Santos", incidence: 7531600, freq: 0.045},
// 	{surname: "Pereira", incidence: 4289612, freq: 0.034},
// 	{surname: "Alves", incidence: 2450659, freq: 0.029},
// 	{surname: "Ferreira", incidence: 2399473, freq: 0.028},
// 	{surname: "Rodrigues", incidence: 1500937, freq: 0.025},
// ]

// $.get("data/br-surnames.csv", function(csv) {
// 	var data = csv.split("\n").map((d) => d.split(";"));
// 	var headers = data.shift();

// 	var total_incidences = data.map((a) => parseInt(a[2].replaceAll(",", ""))).reduce((a, b) => a + b)
// 	br_surnames = data.map((d) => { return {
// 		surname: d[1],
// 		incidence: parseInt(d[2].replaceAll(",", "")),
// 		freq: parseInt(d[2].replaceAll(",", "")) / total_incidences
// 	}});

// 	let curr_freq = 0;
// 	for (var i = 0; i < br_surnames.length; i++) {
// 		br_surnames[i]['y'] = curr_freq;
// 		curr_freq += br_surnames[i]['freq'];
// 	}

// 	var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(br_surnames));
//     var downloadAnchorNode = document.createElement('a');
//     downloadAnchorNode.setAttribute("href",     dataStr);
//     downloadAnchorNode.setAttribute("download", "br_surnames.json");
//     document.body.appendChild(downloadAnchorNode); // required for firefox
//     downloadAnchorNode.click();
//     downloadAnchorNode.remove();
// });

// let br_f_forenames = [
// 	{forename: "Maria"},
// 	{forename: "Ana"},
// 	{forename: "Francisca"},
// 	{forename: "Antônia"},
// 	{forename: "Adriana"},
// 	{forename: "Juliana"},
// 	{forename: "Márcia"},
// 	{forename: "Fernanda"},
// ]

// let br_m_forenames = [
// 	{forename: 'Joao'},
// 	{forename: 'Antonio'},
// 	{forename: 'Francisco'},
// 	{forename: 'Carlos'},
// 	{forename: 'Paulo'},
// 	{forename: 'Pedro'},
// 	{forename: 'Lucas'},
// 	{forename: 'Luiz'},
// 	{forename: 'Marcos'},
// ]

// let kr_f_forenames = [
// 	{forename: 'Seo-Yun'},
// 	{forename: 'Ji-u'},
// 	{forename: 'Seo-Hyeon'},
// 	{forename: 'Min-Seo'},
// 	{forename: 'Ha-Eun'},
// 	{forename: 'Ha-Yun'},
// 	{forename: 'Yun-Seo'},
// 	{forename: 'Ji-Min'},
// 	{forename: 'Chae-Won'},
// ]

// let kr_m_forenames = [
// 	{forename: 'Seo-Jun'},
// 	{forename: 'Ye-jun'},
// 	{forename: 'Do-Yun'},
// 	{forename: 'Ju-Won'},
// 	{forename: 'Si-U'},
// 	{forename: 'Ha-Jun'},
// 	{forename: 'Ji-Hu'},
// 	{forename: 'Ji-Ho'},
// 	{forename: 'Jun-Seo'},
// ]