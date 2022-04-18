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

var last_typing_time = (new Date()).getTime();
var last_typed = "";
var last_loaded = "";

function toggle_buttons(value) {
	$("button").prop("disabled", !value);
}

function handle_name_input(event) {
	last_typing_time = (new Date()).getTime();
	last_typed = event.value;
}

function update_suggestions() {
	load_wiki_thumbnail("https://i.imgur.com/cgHLMDv.png")
	load_wiki_suggestions("pt", last_typed);
	last_loaded = last_typed;
}

function clear_wiki_suggestions() {
	$("#wiki-area").html("");
	$("#kr-name-title").text("Nome sul-coreano")
	$("#br-name-title").text("Nome brasileiro")
}

setInterval(function() {
	var curr_time = (new Date()).getTime();
	if ((curr_time - last_typing_time) / 1000 > 1 && last_loaded != last_typed) {
		update_suggestions();
	}
}, 500)

function load_wiki_thumbnail(img_src) {
	$("#img-thumb").fadeOut(500, function() {
		$("#img-thumb").attr("src", img_src);
	}).fadeIn();
}

function load_wiki_suggestions(wikicode, fullname) {
	if (fullname == "") {
		clear_wiki_suggestions();
		load_wiki_thumbnail("https://i.imgur.com/cgHLMDv.png")
		toggle_buttons(false);
		return;
	}

	console.log(`Loading '${last_typed}' from ${wikicode} wikipedia.`)

	fetch(`https://${wikicode}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${fullname}&format=json&prop=pageimages&origin=*`, { mode: 'cors' })
	.then(response => response.json())
	.then(data => {
		var top_3 = data.query.search.slice(0, 5);
		console.log(top_3);
		var pageids = top_3.map((p) => p.pageid).join("|")
		console.log(pageids);

		if (wikicode != "en" && data.query.search.length == 0) {
			load_wiki_suggestions("en", fullname);
		} else {
			fetch(`https://${wikicode}.wikipedia.org/w/api.php?action=query&pageids=${pageids}&prop=pageimages&format=json&pithumbsize=300&origin=*`, { mode: 'cors' })
			.then(response => response.json())
			.then((data2) => {
				var thumbs = Object.values(data2.query.pages)
					.map((p) => {return{thumbnail: p.thumbnail, id: p.pageid, title: p.title}})
					.filter((p) => p.thumbnail)

				if (thumbs.length > 0) {
					var msg = ""
					msg += "<b>Carregar imagem pelo nome (opcional):</b>"
					msg += "<ul>"
					msg += top_3.map((f) => {
						var thumb = thumbs.find((t) => t.id == f.pageid);
						if (thumb) {
							return `<li><a class='wiki-link' onclick="load_wiki_thumbnail('${thumb.thumbnail.source}')">${thumb.title}</a></li>`
						}
						return ""
					}).join("")
					msg += "</ul>"
					
					$("#wiki-area").html(msg);
					toggle_buttons(true);
				} else {
					if (wikicode != "en") {
						load_wiki_suggestions("en", fullname);
					}
				}
			});
		}
	})
}