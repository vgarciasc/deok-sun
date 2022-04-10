var surname_width = 600; 
var surname_height = 300;
var forename_width = 300;
var forename_height = 200;

var fr_bar_dim = { width: (forename_width - 10) / 2, height: 30, padding_y: 1, padding_x: 10 }
var sr_bar_dim = { width: (surname_width - 60) / 2, height_base: 800, padding_y: 1, padding_x: 60 }

function get_forename_y_by_rank(rank) {
	return rank * (fr_bar_dim.height + fr_bar_dim.padding_y);
}

function get_surname_y(entry, rank) {
	return entry.y * sr_bar_dim.height_base + sr_bar_dim.padding_y * rank;
}

function get_current_surname_y_pos() {
	return 0;
}

function find_forename(forename, lang, gender) {
	var list = [];
	switch ((lang + "_" + gender)) {
		case "kr_m": list = kr_m_forenames; break;
		case "kr_f": list = kr_f_forenames; break;
		case "br_m": list = br_m_forenames; break;
		case "br_f": list = br_f_forenames; break;
	}
	var idx = list.findIndex((f) => f.forename == forename);
	return [idx, list[idx]]
}

function translate_forename(surname, forename, lang, gender) {
	var list = [];
	switch ((lang + "_" + gender)) {
		case "kr_m": list = br_m_forenames; break;
		case "kr_f": list = br_f_forenames; break;
		case "br_m": list = kr_m_forenames; break;
		case "br_f": list = kr_f_forenames; break;
	}
	return list[find_forename(forename, lang, gender)[0]];
}

function translate_surname_kr2br(surname, forename, gender) {
	var surname_entry, surname_idx;
	surname_idx = kr_surnames.findIndex((f) => f.surname == surname)
	surname_entry = kr_surnames[surname_idx]

	var forename_idx, forename_entry;
	[forename_idx, forename_entry] = find_forename(forename, "kr", gender);
	var forename_val = forename_idx / 1000;

	var line_pos_2 = -get_surname_y(surname_entry, surname_idx) + forename_val * (sr_bar_dim.height_base * surname_entry.freq);
	var br_surname_idx = br_surnames.findIndex((f, i) => get_surname_y(f, i) >= Math.max(0, line_pos_2)) - 1;
	if (br_surname_idx == -1) {
		console.error("Could not find paired brazilian surname. Using first.")
		br_surname_idx = 0;
	}

	return br_surnames[br_surname_idx];
}

function translate_surname_br2kr(surname, forename, gender) {
	var br_surname_start = 0;
	var br_surname_end = 0;
	var br_freq = 0;

	for (var br_surname of br_surnames) {
		br_surname_start += br_freq;
		br_freq += br_surname.freq;
		br_surname_end += br_freq;
		
		if (br_surname.surname == surname) {
			break;
		}
	}

	var kr_forename = translate_forename(surname, forename, "br", gender)
	var kr_surname_candidates = [];
	var kr_surname_start = 0;
	var kr_surname_end = 0;
	var kr_freq = 0;

	for (var kr_surname of kr_surnames) {
		kr_surname_start += kr_freq;
		kr_freq += kr_surname.freq;
		kr_surname_end += kr_freq;
		
		if ((kr_surname_start >= br_surname_start && kr_surname_start <= br_surname_end) ||
			(kr_surname_end >= br_surname_start && kr_surname_end <= br_surname_end) ||
			(br_surname_start >= kr_surname_start && br_surname_end <= kr_surname_end)) {
			
			kr_surname_candidates.push(kr_surname)
			var br_surname = translate_surname_kr2br(kr_surname.surname, kr_forename.forename, gender);
			if (br_surname.surname == surname) {
				return kr_surname
			}
		}
	}

	console.error("Could not find adequate pair.")
	return kr_surname_candidates[0];
}

function animate_forename_selection(forename, lang, gender) {
	var idx = find_forename(forename, lang, gender)[0];
	var svg = d3.select(`#svg-${gender}-forename`).select("g");

	$(`.bar-selected`).removeClass("bar-selected")
	$(`.svg-container.faded`).removeClass("faded")
	$(`#svg-${gender == 'm' ? 'f' : 'm'}-forename`).addClass("faded")

	return svg.transition()
		.duration(2000)
		.attr("transform", `translate(0, ${-get_forename_y_by_rank(idx) + forename_height/2 - fr_bar_dim.height/2})`)
		.on("end", () => {
			$(`#${lang}-${gender}-forename-${idx}`).addClass("bar-selected")
			svg.transition()
				.duration(1000)
				.on("end", () => {
					$(`#${lang == 'kr' ? 'br' : 'kr'}-${gender}-forename-${idx}`).addClass("bar-selected")
				})
		})
}

function animate_surname_selection(surname, forename, lang, gender) {
	var surname_entry, surname_idx;
	if (lang == "kr") {
		surname_idx = kr_surnames.findIndex((f) => f.surname == surname)
		surname_entry = kr_surnames[surname_idx]
	} else if (lang == "br") {
		surname_idx = br_surnames.findIndex((f) => f.surname == surname)
		surname_entry = br_surnames[surname_idx]
	}

	var forename_idx, forename_entry;
	[forename_idx, forename_entry] = find_forename(forename, lang, gender);
	var forename_val = forename_idx / 1000;

	$(".surname-rect.bar-selected").removeClass("bar-selected");
	$("#surname-pairing").addClass("hidden");

	var svg = d3.select("#svg-surname").select("g")
	return svg.transition()
		.duration(2000)
		.attr("transform", `translate(0, ${-get_surname_y(surname_entry, surname_idx) + surname_height/2 - (sr_bar_dim.height_base * surname_entry.freq)/2})`)
		.on("end", () => {
			$(`#${lang}-surname-${surname_idx}`).addClass("bar-selected")
			if (lang == "kr") {
				var line_pos_1 = -get_surname_y(surname_entry, surname_idx);
				var line_pos_2 = -get_surname_y(surname_entry, surname_idx) + forename_val * (sr_bar_dim.height_base * surname_entry.freq);

				var br_surname_idx = br_surnames.findIndex((f, i) => get_surname_y(f, i) >= line_pos_2) - 1;
				if (br_surname_idx == -1) {
					br_surname_idx = 0;
				}

				var br_surname = br_surnames[br_surname_idx];

				d3.select("#surname-pairing-name").text(forename_entry.forename)
				d3.select("#surname-pairing-ranking").text("#" + (forename_idx+1))

				d3.select("#surname-pairing")
					.classed("hidden", false)
					.attr("transform", `translate(${sr_bar_dim.width}, ${line_pos_1})`)
					.transition()
					.duration(1000)
					.attr("transform", `translate(${sr_bar_dim.width}, ${line_pos_2})`)
					.on("end", () => {
						$(`#br-surname-${br_surname_idx}`).addClass("bar-selected");
					})
			}
			else if (lang == "br") {
				var kr_surname = translate_surname_br2kr(surname, forename, gender);
				var kr_surname_idx = kr_surnames.findIndex((f) => f.surname == kr_surname.surname);

				var line_pos_1 = -get_surname_y(kr_surname, kr_surname_idx);
				var line_pos_2 = -get_surname_y(kr_surname, kr_surname_idx) + forename_val * (sr_bar_dim.height_base * surname_entry.freq);

				d3.select("#surname-pairing-name").text(forename_entry.forename)
				d3.select("#surname-pairing-ranking").text("#" + (forename_idx+1))

				d3.select("#surname-pairing")
					.classed("hidden", false)
					.attr("transform", `translate(${sr_bar_dim.width}, ${line_pos_1})`)
					.transition()
					.duration(1000)
					.attr("transform", `translate(${sr_bar_dim.width}, ${line_pos_2})`)
					.on("end", () => {
						$(`#kr-surname-${kr_surname_idx}`).addClass("bar-selected");
					})
			}
		})
}

function main() {
	let svg_m_forenames = d3.select("#svg-m-forename")
		.attr("width", forename_width)
		.attr("height", forename_height)
		.append("g")

	svg_m_forenames.append("g")
		.attr("id", "kr-forename-bars")
		.selectAll("rect")
		.data(kr_m_forenames)
		.join(
			enter => {
				enter.append("rect")
					.classed("name-rect", true)
					.classed("male-forename-rect", true)
					.attr("id", (d, i) => `kr-m-forename-${i}`)
					.attr("x", 0)
					.attr("y", (d, i) => i * (fr_bar_dim.height + fr_bar_dim.padding_y))
					.attr("height", fr_bar_dim.height)
					.attr("width", fr_bar_dim.width)
				enter.append("text")
					.attr("x", 10)
					.attr("y", (d, i) => i * (fr_bar_dim.height + fr_bar_dim.padding_y) + fr_bar_dim.height / 2)
					.attr("dy", "0.3em")
					.text((d, i) => `#${i+1}`)
				enter.append("text")
					.attr("x", 40)
					.attr("y", (d, i) => i * (fr_bar_dim.height + fr_bar_dim.padding_y) + fr_bar_dim.height / 2)
					.attr("dy", "0.3em")
					.text(d => d.forename)
					.classed("forename-text", true)
			}
		)

	svg_m_forenames.append("g")
		.attr("id", "br-forename-bars")
		.selectAll("rect")
		.data(br_m_forenames)
		.join(
			enter => {
				enter.append("rect")
					.classed("name-rect", true)
					.classed("male-forename-rect", true)
					.attr("id", (d, i) => `br-m-forename-${i}`)
					.attr("x", fr_bar_dim.width + fr_bar_dim.padding_x)
					.attr("y", (d, i) => get_forename_y_by_rank(i))
					.attr("height", fr_bar_dim.height)
					.attr("width", fr_bar_dim.width)
				enter.append("text")
					.attr("x", fr_bar_dim.width + fr_bar_dim.padding_x + 10)
					.attr("y", (d, i) => get_forename_y_by_rank(i) + fr_bar_dim.height / 2)
					.attr("dy", "0.3em")
					.text((d, i) => `#${i+1}`)
				enter.append("text")
					.attr("x", fr_bar_dim.width + fr_bar_dim.padding_x + 40)
					.attr("y", (d, i) => get_forename_y_by_rank(i) + fr_bar_dim.height / 2)
					.attr("dy", "0.3em")
					.text(d => d.forename)
					.classed("forename-text", true)
			}
		)

	let svg_f_forenames = d3.select("#svg-f-forename")
		.classed("forename-view", true)
		.attr("width", forename_width)
		.attr("height", forename_height)
		.append("g")

	svg_f_forenames.append("g")
		.attr("id", "kr-forename-bars")
		.selectAll("rect")
		.data(kr_f_forenames)
		.join(
			enter => {
				enter.append("rect")
					.classed("name-rect", true)
					.classed("female-forename-rect", true)
					.attr("id", (d, i) => `kr-f-forename-${i}`)
					.attr("x", 0)
					.attr("y", (d, i) => i * (fr_bar_dim.height + fr_bar_dim.padding_y))
					.attr("height", fr_bar_dim.height)
					.attr("width", fr_bar_dim.width)
				enter.append("text")
					.attr("x", 10)
					.attr("y", (d, i) => i * (fr_bar_dim.height + fr_bar_dim.padding_y) + fr_bar_dim.height / 2)
					.attr("dy", "0.3em")
					.text((d, i) => `#${i+1}`)
				enter.append("text")
					.attr("x", 40)
					.attr("y", (d, i) => i * (fr_bar_dim.height + fr_bar_dim.padding_y) + fr_bar_dim.height / 2)
					.attr("dy", "0.3em")
					.text(d => d.forename)
					.classed("forename-text", true)
			}
		)

	svg_f_forenames.append("g")
		.attr("id", "br-forename-bars")
		.selectAll("rect")
		.data(br_f_forenames)
		.join(
			enter => {
				enter.append("rect")
					.classed("name-rect", true)
					.classed("female-forename-rect", true)
					.attr("id", (d, i) => `br-f-forename-${i}`)
					.attr("x", fr_bar_dim.width + fr_bar_dim.padding_x)
					.attr("y", (d, i) => i * (fr_bar_dim.height + fr_bar_dim.padding_y))
					.attr("height", fr_bar_dim.height)
					.attr("width", fr_bar_dim.width)
				enter.append("text")
					.attr("x", fr_bar_dim.width + fr_bar_dim.padding_x + 10)
					.attr("y", (d, i) => i * (fr_bar_dim.height + fr_bar_dim.padding_y) + fr_bar_dim.height / 2)
					.attr("dy", "0.3em")
					.text((d, i) => `#${i+1}`)
				enter.append("text")
					.attr("x", fr_bar_dim.width + fr_bar_dim.padding_x + 40)
					.attr("y", (d, i) => i * (fr_bar_dim.height + fr_bar_dim.padding_y) + fr_bar_dim.height / 2)
					.attr("dy", "0.3em")
					.text(d => d.forename)
					.classed("forename-text", true)
			}
		)
	let svg_surnames = d3.select("#svg-surname")
		.attr("width", surname_width)
		.attr("height", surname_height)
		.append("g")

	svg_surnames.append("g")
		.attr("id", "kr-surname-bars")
		.selectAll("rect")
		.data(kr_surnames)
		.join(
			enter => {
				enter.append("rect")
					.classed("name-rect", true)
					.classed("surname-rect", true)
					.attr("id", (d, i) => `kr-surname-${i}`)
					.attr("x", 0)
					.attr("y", (d, i) => d.y * sr_bar_dim.height_base + sr_bar_dim.padding_y * i)
					.attr("height", (d, i) => d.freq * sr_bar_dim.height_base)
					.attr("width", sr_bar_dim.width)
				enter.append("text")
					.attr("x", 20)
					.attr("y", (d, i) => d.y * sr_bar_dim.height_base + sr_bar_dim.padding_y * i + d.freq * sr_bar_dim.height_base / 2)
					.attr("dy", "0.3em")
					.text(d => `(${d.freq.toFixed(3)})`)
				enter.append("text")
					.attr("x", sr_bar_dim.width - 100)
					.attr("y", (d, i) => d.y * sr_bar_dim.height_base + sr_bar_dim.padding_y * i + d.freq * sr_bar_dim.height_base / 2)
					.attr("dy", "0.3em")
					.text(d => d.surname)
					.classed("surname-text", true)
			}
		)

	svg_surnames.append("g")
		.attr("id", "br-surname-bars")
		.selectAll("rect")
		.data(br_surnames)
		.join(
			enter => {
				enter.append("rect")
					.classed("name-rect", true)
					.classed("surname-rect", true)
					.attr("id", (d, i) => `br-surname-${i}`)
					.attr("x", sr_bar_dim.width + sr_bar_dim.padding_x)
					.attr("y", (d, i) => get_surname_y(d, i))
					.attr("height", (d, i) => d.freq * sr_bar_dim.height_base)
					.attr("width", sr_bar_dim.width)
				enter.append("text")
					.attr("x", sr_bar_dim.width + sr_bar_dim.padding_x + 20)
					.attr("y", (d, i) => d.y * sr_bar_dim.height_base + sr_bar_dim.padding_y * i + d.freq * sr_bar_dim.height_base / 2)
					.attr("dy", "0.3em")
					.text(d => d.surname)
					.classed("surname-text", true)
				enter.append("text")
					.attr("x", sr_bar_dim.width + sr_bar_dim.padding_x + sr_bar_dim.width - 100)
					.attr("y", (d, i) => d.y * sr_bar_dim.height_base + sr_bar_dim.padding_y * i + d.freq * sr_bar_dim.height_base / 2)
					.attr("dy", "0.3em")
					.text(d => `(${d.freq.toFixed(3)})`)
			}
		)

	var sr_pairing = svg_surnames.append("g")
		.attr("id", "surname-pairing")
		.classed("hidden", true)
		.attr("transform", `translate(${sr_bar_dim.width}, 50)`)
	sr_pairing.append("line")
		.attr("x1", 0)
		.attr("y1", 0)
		.attr("x2", sr_bar_dim.padding_x)
		.attr("y2", 0)
	sr_pairing.append("text")
		.attr("id", "surname-pairing-name")
		.attr("x", 5)
		.attr("dy", "-0.5em")
		.text("Da-mi")
	sr_pairing.append("text")
		.attr("id", "surname-pairing-ranking")
		.attr("x", 5)
		.attr("dy", "1.2em")
		.text("#5")
}

function translate_kr2br() {
	var kr_surname, kr_forename;
	[kr_surname, kr_forename] = $("#kr-input").val().split(" ")
	var gender = $("input[name=gender]").filter(":checked").val();
	var lang = "kr";

	$("#kr-name-title").fadeOut(() => { $("#kr-name-title").text(kr_surname + " " + kr_forename)}).fadeIn()

	var br_forename = translate_forename(kr_surname, kr_forename, lang, gender).forename;
	var br_surname = translate_surname_kr2br(kr_surname, kr_forename, gender).surname;

	setTimeout(() => {
		animate_forename_selection(kr_forename, lang, gender)
		setTimeout(() => {
			animate_surname_selection(kr_surname, kr_forename, lang, gender)
			setTimeout(() => {
				$("#br-input").val(br_forename + " " + br_surname);
				$("#br-name-title").fadeOut(() => { $("#br-name-title").text(br_forename + " " + br_surname)}).fadeIn()
			}, 5000)
		}, 3000)
	}, 500)
}

main();