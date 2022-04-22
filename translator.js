kr_m_forenames.forEach((f) => { f.forename = f.forename.charAt(0).toUpperCase() + f.forename.slice(1) })
kr_f_forenames.forEach((f) => { f.forename = f.forename.charAt(0).toUpperCase() + f.forename.slice(1) })

kr_m_forenames.forEach((f, i) => f['rank'] = i);
br_m_forenames.forEach((f, i) => f['rank'] = i);
kr_f_forenames.forEach((f, i) => f['rank'] = i);
br_f_forenames.forEach((f, i) => f['rank'] = i);

//performance test
// kr_m_forenames.splice(100)
// kr_f_forenames.splice(100)
// br_m_forenames.splice(100)
// br_f_forenames.splice(100)

let kr_m_forenames_viewbox = kr_m_forenames.slice(0, 50);
let kr_f_forenames_viewbox = kr_f_forenames.slice(0, 50);
let br_m_forenames_viewbox = br_m_forenames.slice(0, 50);
let br_f_forenames_viewbox = br_f_forenames.slice(0, 50);

let current_m_forename_idx = 0;
let current_f_forename_idx = 0;
let recent_forename_idxs = [0];

//////////////////

var surname_width = 750; 
var surname_height = 300;
var forename_width = 375;
var forename_height = 200;

var fr_bar_dim = { width: (forename_width - 10) / 2, height: 30, padding_y: 1, padding_x: 10 }
var sr_bar_dim = { width: (surname_width - 80) / 2, padding_y: 1, padding_x: 90,
	height_base: 10000, min_height: 15, max_height: 999999}

function get_full_name(surname_str, forename_str, lang) {
	if (lang == "kr") return surname_str + " " + forename_str;
	return forename_str + " " + surname_str;
}

function get_freq_as_string(freq) {
	return (freq * 100).toFixed(5) + "%"
}

function constrain_heights() {
	let curr_freq = 0;
	for (var i = 0; i < kr_surnames.length; i++) {
		kr_surnames[i]['freq_acc'] = kr_surnames[i]['y'];
		kr_surnames[i]['y'] = curr_freq;
		curr_freq += get_surname_height(kr_surnames[i])
	}

	curr_freq = 0;
	for (var i = 0; i < br_surnames.length; i++) {
		br_surnames[i]['freq_acc'] = br_surnames[i]['y'];
		br_surnames[i]['y'] = curr_freq;
		curr_freq += get_surname_height(br_surnames[i])
	}
}

function get_forename_y_by_rank(rank) {
	return rank * (fr_bar_dim.height + fr_bar_dim.padding_y);
}

function get_surname_y(entry, rank) {
	return entry.y + sr_bar_dim.padding_y * rank;
}

function get_surname_height(entry) {
	var val = sr_bar_dim.height_base * entry.freq;
	return Math.max(Math.min(val, sr_bar_dim.max_height), sr_bar_dim.min_height);
}

function find_surname(surname_str, lang) {
	function clean(str) { return str.toLowerCase().to_ascii() };

	var list = [];
	switch (lang) {
		case "kr": list = kr_surnames; break;
		case "br": list = br_surnames; break;
	}
	
	surname_str = clean(surname_str);
	var idx = list.findIndex((f) => clean(f.surname) == surname_str);
	var perfect_match = (idx != -1);

	if (!perfect_match) {
		var edit_distances = list.map((f) => editDistance(surname_str, f.surname));
		idx = argmin(edit_distances);

		if (edit_distances[idx] > 5) {
			//too distant
			idx = -1;
		}
	}

	return [idx, list[idx], perfect_match]
}

function find_forename(forename_str, lang, gender) {
	var m_list = [];
	var f_list = [];

	switch (lang) {
		case "kr":
			m_list = kr_m_forenames;
			f_list = kr_f_forenames;
			break;
		case "br":
			m_list = br_m_forenames;
			f_list = br_f_forenames;
			break;
	}

	function find_forename_in_list(forename_str, list) {
		function clean(str) { return str.toLowerCase().to_ascii() };

		var forename_str = clean(forename_str);
		var idx = list.findIndex((f) => clean(f.forename) == forename_str);
		var perfect_match = true;

		if (idx == -1) {
			if (lang == "br") {
				perfect_match = false;

				// searching in alternative names
				idx = list.findIndex((f) => f.aliases.find((a) => clean(a) == forename_str))

				// searching for closest forename
				if (idx == -1) {
					var edit_distances = list.map((f) => editDistance(forename_str, f.forename));
					idx = argmin(edit_distances);

					if (edit_distances[idx] > 3) {
						//too distant
						idx = -1;
					}
				}
			}
			if (lang == "kr") {
				// searching without hyphen
				idx = list.findIndex((f) => clean(f.forename).replace("-", "") == forename_str)
				if (idx == -1) idx = list.findIndex((f) => clean(f.rr) == forename_str)
				if (idx == -1) idx = list.findIndex((f) => clean(f.rr).replace("-", "") == forename_str)

				if (idx == -1) {
					perfect_match = false;

					var edit_distances = list.map((f) => Math.min(
						editDistance(forename_str.replace("-", ""), f.forename.replace("-", "")),
						editDistance(forename_str.replace("-", ""), f.rr.replace("-", ""))));
					idx = argmin(edit_distances);

					if (edit_distances[idx] > 10) {
						//too distant
						idx = -1;
					}
				}
			}
		}

		return [idx, list[idx], perfect_match]
	}

	var male_forename_idx, male_forename_entry, male_pmatch;
	var female_forename_idx, female_forename_entry, female_pmatch;
	var forename_idx, forename_entry, pmatch;

	[male_forename_idx, male_forename_entry, male_pmatch] = find_forename_in_list(forename_str, m_list);
	[female_forename_idx, female_forename_entry, female_pmatch] = find_forename_in_list(forename_str, f_list);

	if (gender == "auto") {
		if ((male_pmatch && female_pmatch) ||
			(!male_pmatch && !female_pmatch && male_forename_idx != -1 && female_forename_idx != -1)) {
			return male_forename_idx < female_forename_idx ? 
				[male_forename_idx, male_forename_entry, "m", male_pmatch]
				: [female_forename_idx, female_forename_entry, "f", female_pmatch]
		} else if (male_pmatch) {
			return [male_forename_idx, male_forename_entry, "m", male_pmatch]
		} else if (female_pmatch) {
			return [female_forename_idx, female_forename_entry, "f", female_pmatch]
		}

		if (female_forename_idx == -1 && male_forename_idx != -1) {
			forename_idx = male_forename_idx;
			forename_entry = male_forename_entry;
			pmatch = male_pmatch;
			gender = "m";
		} else if (female_forename_idx != -1 && male_forename_idx == -1) {
			forename_idx = female_forename_idx;
			forename_entry = female_forename_entry;
			pmatch = female_pmatch;
			gender = "f";
		} else {
			console.error("Something bad happened.")
		}
	}
	else if (gender == "m") {
		forename_idx = male_forename_idx;
		forename_entry = male_forename_entry;
		pmatch = male_pmatch;
	} else if (gender == "f") {
		forename_idx = female_forename_idx;
		forename_entry = female_forename_entry;
		pmatch = female_pmatch;
	}

	return [forename_idx, forename_entry, gender, pmatch]
}

function translate_forename(surname, forename, lang, gender) {
	switch (lang) {
		case "kr":
			m_list = br_m_forenames;
			f_list = br_f_forenames;
			break;
		case "br":
			m_list = kr_m_forenames;
			f_list = kr_f_forenames;
			break;
	}

	var forename_idx, forename_entry, gender, pmatch;
	[forename_idx, forename_entry, gender, pmatch] = find_forename(forename, lang, gender);

	if (lang == "br") {
		return gender == "m" ? kr_m_forenames[forename_idx] : kr_f_forenames[forename_idx];
	} else {
		return gender == "m" ? br_m_forenames[forename_idx] : br_f_forenames[forename_idx];
	}
}

function translate_surname_kr2br(surname, forename, gender) {
	var kr_surname_entry, kr_surname_idx;
	[kr_surname_idx, kr_surname_entry, _] = find_surname(surname, "kr");

	if (kr_surname_idx == -1) {
		console.warn(`Could not find korean surname ${surname}`)
	}

	var kr_forename_idx, kr_forename_entry;
	[kr_forename_idx, kr_forename_entry, _, _] = find_forename(forename, "kr", gender);
	var forename_val = kr_forename_idx / kr_f_forenames.length;

	var kr_surname_start = kr_surname_entry.freq_acc;
	var kr_surname_end = kr_surname_entry.freq_acc + kr_surname_entry.freq;
	var kr_surname_pt = kr_surname_start + (kr_surname_entry.freq * forename_val);

	var br_surname_entry = br_surnames.find((br) => br.freq_acc >= kr_surname_pt);
	if (!br_surname_entry) {
		console.warn(`Could not find paired brazilian surname for korean surname ${kr_surname_entry}`)
	}

	return br_surname_entry;
}

function translate_surname_br2kr(surname_str, forename_str, gender) {
	var br_surname_entry, br_surname_idx;
	[br_surname_idx, br_surname_entry, _] = find_surname(surname_str, "br")

	var br_surname_start = br_surname_entry.freq_acc;
	var br_surname_end = br_surname_entry.freq_acc + br_surname_entry.freq;

	var kr_forename_entry = translate_forename(surname_str, forename_str, "br", gender);
	var kr_surname_candidates = [];

	for (var kr_surname_entry of kr_surnames) {
		var kr_surname_idx = find_surname(kr_surname_entry.surname, "kr")[0]
		var kr_surname_start = kr_surname_entry.freq_acc;
		var kr_surname_end = kr_surname_entry.freq_acc + kr_surname_entry.freq;
		
		if ((kr_surname_start >= br_surname_start && kr_surname_start <= br_surname_end) ||
			(kr_surname_end >= br_surname_start && kr_surname_end <= br_surname_end) ||
			(br_surname_start >= kr_surname_start && br_surname_end <= kr_surname_end)) {
			
			kr_surname_candidates.push(kr_surname_entry)

			var kr_candidate_surname_proposal = translate_surname_kr2br(kr_surname_entry.surname, kr_forename_entry.forename, gender);
			if (kr_candidate_surname_proposal.surname == surname_str) {
				return kr_surname_entry
			}
		}
	}
	
	console.log(br_surname_entry)
	console.log(kr_surname_candidates)
	console.error("Could not find adequate pair.")
	return kr_surname_candidates[0];
}

function translate_surname(surname_str, forename_str, lang, gender) {
	if (lang == "kr") {
		return translate_surname_kr2br(surname_str, forename_str, gender)
	} else {
		return translate_surname_br2kr(surname_str, forename_str, gender)
	}
}

function animate_forename_selection(forename, lang, gender) {
	var idx = find_forename(forename, lang, gender)[0];
	var svg = d3.select(`#svg-${gender}-forename`).select("g");

	$(`.bar-selected`).removeClass("bar-selected")
	$(`.svg-container.faded`).removeClass("faded")
	$(`#svg-${gender == 'm' ? 'f' : 'm'}-forename`).addClass("faded")
	$(`#${gender}-forename-pairing-line`).addClass("hidden")
	$(`#surname-pairing`).addClass("hidden")

	if (gender == "m") { 
		recent_forename_idxs.push(current_m_forename_idx);
		current_m_forename_idx = idx
	} else { 
		recent_forename_idxs.push(current_f_forename_idx);
		current_f_forename_idx = idx
	};

	recent_forename_idxs.push(idx);
	if (recent_forename_idxs.length > 4) {
		recent_forename_idxs = recent_forename_idxs.slice(1);
	}
	console.log("Recent forename idxs: ")
	console.log(recent_forename_idxs)

	var idxs_to_show = [];
	for (var recent_forename_idx of recent_forename_idxs) {
		var min = Math.max(recent_forename_idx - 100, 0);
		var max = Math.min(recent_forename_idx + 100, kr_m_forenames.length);
		for (var i = min; i < max; i++) {
			idxs_to_show.push(i);
		}
		for (var i = 0; i < min; i += 50) {
			idxs_to_show.push(i);
		}
	}

	if (gender == "m") {
		kr_m_forenames_viewbox = kr_m_forenames.filter((_, i) => idxs_to_show.includes(i));
		br_m_forenames_viewbox = br_m_forenames.filter((_, i) => idxs_to_show.includes(i));
		update_forenames(kr_m_forenames_svg, kr_m_forenames_viewbox, "m", "kr")
		update_forenames(br_m_forenames_svg, br_m_forenames_viewbox, "m", "br")
	} else {
		kr_f_forenames_viewbox = kr_f_forenames.filter((_, i) => idxs_to_show.includes(i));
		br_f_forenames_viewbox = br_f_forenames.filter((_, i) => idxs_to_show.includes(i));
		update_forenames(kr_f_forenames_svg, kr_f_forenames_viewbox, "f", "kr")
		update_forenames(br_f_forenames_svg, br_f_forenames_viewbox, "f", "br")
	}

	return svg.transition()
		.duration(2000)
		.attr("transform", `translate(0, ${-get_forename_y_by_rank(idx) + forename_height/2 - fr_bar_dim.height/2})`)
		.on("end", () => {
			$(`#${lang}-${gender}-forename-${idx}`).addClass("bar-selected")
			$(`#${gender}-forename-pairing-line`).removeClass("hidden")

			svg.transition()
				.duration(500)
				.on("end", () => {
					$(`#${lang == 'kr' ? 'br' : 'kr'}-${gender}-forename-${idx}`).addClass("bar-selected")
				})
		})
}

function animate_surname_selection(surname, forename, lang, gender) {
	var surname_entry, surname_idx;
	[surname_idx, surname_entry, _] = find_surname(surname, lang);

	var forename_idx, forename_entry;
	[forename_idx, forename_entry, _, _] = find_forename(forename, lang, gender);
	var forename_val = forename_idx / 1000; //TODO: change

	$(".surname-rect.bar-selected").removeClass("bar-selected");

	var svg = d3.select(`#${lang}-surname-bars`)
	return svg.transition()
		.duration(1000)
		.attr("transform", `translate(0, ${-get_surname_y(surname_entry, surname_idx) + surname_height/2 - get_surname_height(surname_entry)/2})`)
		.on("end", () => {
			$(`#${lang}-surname-${surname_idx}`).addClass("bar-selected")
			if (lang == "kr") {
				var br_surname_entry = translate_surname_kr2br(surname, forename, gender);
				var br_surname_idx = find_surname(br_surname_entry.surname, "br")[0];
				var translate_y = - get_surname_y(br_surname_entry, br_surname_idx) - get_surname_height(br_surname_entry)/2 + surname_height/2;

				var line_pos_1 = get_surname_y(surname_entry, surname_idx);
				var line_pos_2 = get_surname_y(surname_entry, surname_idx) + get_surname_height(surname_entry)/2;
				// var line_pos_2 = get_surname_y(surname_entry, surname_idx) + forename_val * get_surname_height(surname_entry);

				d3.select("#surname-pairing")
					.attr("transform", `translate(${sr_bar_dim.width}, ${line_pos_1})`)

				d3.select("#br-surname-bars")
					.transition()
					.duration(1000)
					.attr("transform", `translate(0, ${translate_y})`)
					.on("end", () => {
						d3.select("#surname-pairing-name").text(forename)
						d3.select("#surname-pairing-ranking").text("#" + (forename_idx+1))
						
						d3.select("#surname-pairing")
							.classed("hidden", false)
							.transition()
							.duration(1000)
							.attr("transform", `translate(${sr_bar_dim.width}, ${line_pos_2})`)
							.on("end", () => {
								$(`#br-surname-${br_surname_idx}`).addClass("bar-selected");
							})
					});
			}
			else if (lang == "br") {
				var br_surname_entry, br_surname_idx;
				[br_surname_idx, br_surname_entry, _] = find_surname(surname, "br")

				var kr_forename_str = translate_forename(surname, forename, "br", gender).forename;
				var kr_surname_entry = translate_surname_br2kr(surname, forename, gender);
				var kr_surname_idx = find_surname(kr_surname_entry.surname, "kr")[0]

				var translate_y = - get_surname_y(kr_surname_entry, kr_surname_idx) - get_surname_height(kr_surname_entry)/2 + surname_height/2;

				var line_pos_1 = get_surname_y(kr_surname_entry, kr_surname_idx);
				var line_pos_2 = get_surname_y(kr_surname_entry, kr_surname_idx) + get_surname_height(kr_surname_entry)/2;

				d3.select("#surname-pairing")
					.attr("transform", `translate(${sr_bar_dim.width}, ${line_pos_1})`)

				d3.select("#kr-surname-bars")
					.transition()
					.duration(1000)
					.attr("transform", `translate(0, ${translate_y})`)
					.on("end", () => {
						d3.select("#surname-pairing-name").text(forename)
						d3.select("#surname-pairing-ranking").text("#" + (forename_idx+1))

						d3.select("#surname-pairing")
							.classed("hidden", false)
							.transition()
							.duration(500)
							.attr("transform", `translate(${sr_bar_dim.width}, ${line_pos_2})`)
							.on("end", () => {
								$(`#kr-surname-${kr_surname_idx}`).addClass("bar-selected");
							})
					});
			}
		})
}

function update_forenames(svg, forename_data, gender, lang) {
	svg.selectAll("g")
		.data(forename_data, (d) => d.rank)
		.join(
			enter => {
				var group = enter.append("g");

				group.append("line")
					.attr("stroke", "white")
					.attr("stroke-width", 2)
					.attr("x1", (_) => {
						if (lang == "kr") {
							return 0;
						} else {
							return fr_bar_dim.width + fr_bar_dim.padding_x;
						}
					})
					.attr("y1", (d, i) => get_forename_y_by_rank(d.rank) + fr_bar_dim.height)
					.attr("x2", (_) => {
						if (lang == "kr") {
							return fr_bar_dim.width;
						} else {
							return 2 * fr_bar_dim.width + fr_bar_dim.padding_x;
						}
					})
					.attr("y2", (d, i) => get_forename_y_by_rank(d.rank) + fr_bar_dim.height)
				group.append("rect")
					.classed("name-rect", true)
					.classed(`${gender == 'm' ? 'male' : 'female'}-forename-rect`, true)
					.attr("id", (d, i) => `${lang}-${gender}-forename-${d.rank}`)
					.attr("x", (_) => {
						if (lang == "kr") {
							return 0;
						} else {
							return fr_bar_dim.width + fr_bar_dim.padding_x;
						}
					})
					.attr("y", (d, i) => get_forename_y_by_rank(d.rank))
					.attr("height", fr_bar_dim.height)
					.attr("width", fr_bar_dim.width)
				group.append("text")
					.classed("text-rank", true)
					.attr("x", (_) => {
						if (lang == "kr") {
							return 10;
						} else {
							return fr_bar_dim.width + fr_bar_dim.padding_x + 10;
						}
					})
					.attr("y", (d, i) => get_forename_y_by_rank(d.rank) + fr_bar_dim.height / 2)
					.attr("dy", "0.3em")
					.text((d, i) => `#${d.rank+1}`)
				group.append("text")
					.classed("text-forename", true)
					.attr("x", (_) => {
						if (lang == "kr") {
							return 60;
						} else {
							return fr_bar_dim.width + fr_bar_dim.padding_x + 60;
						}
					})
					.attr("y", (d, i) => get_forename_y_by_rank(d.rank) + fr_bar_dim.height / 2)
					.attr("dy", "0.3em")
					.text(d => d.forename)
					// .text(d => d.hangul)

				return group;
			}
		)
}

function add_forename_bg(svg, data, lang, gender) {
	svg.append("rect")
		.classed("name-rect", true)
		.classed(`${gender == 'm' ? 'male' : 'female'}-forename-rect`, true)
		.attr("x", (_) => {
			if (lang == "kr") {
				return 0;
			} else {
				return fr_bar_dim.width + fr_bar_dim.padding_x;
			}
		})
		.attr("y", 0)
		.attr("width", fr_bar_dim.width)
		.attr("height", get_forename_y_by_rank(data.length - 1));	
}

function update_surnames(svg, surname_data, lang) {
	svg.attr("transform", `translate(0, -${get_surname_y(surname_data[0], 0) + get_surname_height(surname_data[0]) / 2 - surname_height / 2})`)
		.selectAll(".surname-bar")
		.data(surname_data)
		.join(
			enter => {
				var group = enter.append("g").classed("surname-bar", true);

				group.append("rect")
					.classed("name-rect", true)
					.classed("surname-rect", true)
					.attr("id", (d, i) => `${lang}-surname-${i}`)
					.attr("x", (_) => {
						if (lang == "kr") {
							return 0;
						} else {
							return sr_bar_dim.width + sr_bar_dim.padding_x;
						}
					})
					.attr("y", (d, i) => get_surname_y(d, i))
					.attr("height", (d, i) => get_surname_height(d))
					.attr("width", sr_bar_dim.width)
				group.append("text")
					.attr("x", (_) => {
						if (lang == "kr") {
							return 20;
						} else {
							return sr_bar_dim.width + sr_bar_dim.padding_x + sr_bar_dim.width - 100;
						}
					})
					// .attr("y", (d, i) => get_surname_y(d, i) + (Math.min(surname_height, get_surname_height(d))) / 2)
					.attr("y", (d, i) => get_surname_y(d, i) + get_surname_height(d) / 2)
					.attr("dy", "0.3em")
					.text(d => `${get_freq_as_string(d.freq)}`)
				group.append("text")
					.attr("x", (_) => {
						if (lang == "kr") {
							return sr_bar_dim.width - 100;
						} else {
							return sr_bar_dim.width + sr_bar_dim.padding_x + 20;
						}
					})
					// .attr("y", (d, i) => get_surname_y(d, i) + (Math.min(surname_height, get_surname_height(d))) / 2)
					.attr("y", (d, i) => get_surname_y(d, i) + get_surname_height(d) / 2)
					.attr("dy", "0.3em")
					.text(d => d.surname)
					.classed("text-surname", true)

				return group;
			}
		)
}

let m_forenames_svg = d3.select("#svg-m-forename")
	.attr("viewBox", `0 0 ${forename_width} ${forename_height}`)
	.attr("preserveAspectRatio", "xMidYMid meet")
	.append("g")

let f_forenames_svg = d3.select("#svg-f-forename")
	.attr("viewBox", `0 0 ${forename_width} ${forename_height}`)
	.attr("preserveAspectRatio", "xMidYMid meet")
	.append("g")

for (var gender of ['m', 'f']) {
	d3.select(`#svg-${gender}-forename`)
		.append("line")
		.classed("smooth-transition", true)
		.classed("hidden", true)
		.attr("id", `${gender}-forename-pairing-line`)
		.attr("x1", fr_bar_dim.width)
		.attr("y1", forename_height/2)
		.attr("x2", fr_bar_dim.width + fr_bar_dim.padding_x)
		.attr("y2", forename_height/2)
}

let kr_m_forenames_svg = m_forenames_svg.append("g").attr("id", "kr-m-forename-bars")
let br_m_forenames_svg = m_forenames_svg.append("g").attr("id", "br-m-forename-bars")
let kr_f_forenames_svg = f_forenames_svg.append("g").attr("id", "kr-f-forename-bars")
let br_f_forenames_svg = f_forenames_svg.append("g").attr("id", "br-f-forename-bars")

add_forename_bg(kr_m_forenames_svg, kr_m_forenames, 'kr', 'm')
add_forename_bg(br_m_forenames_svg, br_m_forenames, 'br', 'm')
add_forename_bg(kr_f_forenames_svg, kr_f_forenames, 'kr', 'f')
add_forename_bg(br_f_forenames_svg, br_f_forenames, 'br', 'f')

let svg_surnames = d3.select("#svg-surname")
	.attr("viewBox", `0 0 ${surname_width} ${surname_height}`)
	.append("g")

let kr_surnames_svg = svg_surnames.append("g").attr("id", "kr-surname-bars")
let br_surnames_svg = svg_surnames.append("g").attr("id", "br-surname-bars")

var sr_pairing = kr_surnames_svg.append("g")
	.attr("id", "surname-pairing")
	.classed("hidden", true)
	.classed("smooth-transition", true)
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

function parse_name_from_input(lang) {
	var string = $("#fullname-input").val();
	if (lang == "br") {
		var words = string.split(" ");
		if (words.length == 2) {
			return [words[1], words[0]];
		} else {
			if (["da", "do", "das", "dos", "de"].includes(words[1].toLowerCase())) {
				return [words.slice(1).join(" "), words[0]]
			} else {
				return [words.slice(2).join(" "), words[0] + " " + words[1], ]
			}
		}
	} else if (lang == "kr") {
		return string.split(" ")
	}
}

function translate_name(lang_src, lang_dst) {
	$(`#error-console`).text("")
	$("#kr-name-title").text("Nome sul-coreano")
	$("#br-name-title").text("Nome brasileiro")

	var src_surname_str, src_forename_str;
	[src_surname_str, src_forename_str] = parse_name_from_input(lang_src);

	if (src_surname_str == undefined || src_forename_str == undefined) {
		$(`#error-console`).text("Por favor, use o formato [Nome Sobrenome] para português, e [Sobrenome Nome] para coreano.")
		return;
	}

	var gender = $("input[name=gender]").filter(":checked").val();
	var gender_str = gender == "m" ? "masculino " : (gender == "f" ? "feminino " : "")
	var fr_perfect_match;

	var log = [];

	var src_surname, src_forename;
	[sr_idx, src_surname, sr_perfect_match] = find_surname(src_surname_str, lang_src);

	if (sr_idx == -1) {
		log.push(`O sobrenome "${src_surname_str}" não foi encontrado.`)
	} else if (!sr_perfect_match) {
		log.push(`O sobrenome "${src_surname_str}" não foi encontrado, usando o mais próximo: "${src_surname.surname}".`)
	}

	[fr_idx, src_forename, gender, fr_perfect_match] = find_forename(src_forename_str, lang_src, gender);

	$(`#error-console`).text("")
	if (fr_idx == undefined) {
		if (src_forename_str.split(" ").length > 1) {
			$(`#error-console`).text(["Por favor, use o formato [Nome Sobrenome] para português, e [Sobrenome Nome] para coreano."]);
			return;
		} else {
			log.push(`O nome ${gender_str}"${src_forename_str}" não foi encontrado.`)
		}
	} else if (!fr_perfect_match) {
		log.push(`O nome ${gender_str}"${src_forename_str}" não foi encontrado. Usando o mais próximo: "${src_forename.forename}".`)
	}
	log.forEach((f) => console.error(f));
	$(`#error-console`).html(log.join("<br><br>"))

	var src_fullname = get_full_name(src_surname_str.capitalize(), src_forename_str.capitalize(), lang_src);

	$(`#${lang_src}-name-title`).fadeOut(() => { 
		$(`#${lang_src}-name-title`).text(src_fullname);
	}).fadeIn()

	var dst_forename_str = translate_forename(src_surname_str, src_forename_str, lang_src, gender).forename;
	var dst_surname_str = translate_surname(src_surname_str, src_forename_str, lang_src, gender).surname;
	var dst_fullname = get_full_name(dst_surname_str, dst_forename_str, lang_dst);

	toggle_buttons(false);

	setTimeout(() => {
		animate_forename_selection(src_forename.forename, lang_src, gender)
		setTimeout(() => {
			animate_surname_selection(src_surname.surname, src_forename.forename, lang_src, gender)
			setTimeout(() => {
				$(`#${lang_dst}-input`).val(dst_fullname);
				toggle_buttons(true);

				$(`#${lang_dst}-name-title`).fadeOut(() => { 
					$(`#${lang_dst}-name-title`).text(dst_fullname)
				}).fadeIn()
			}, 5000)
		}, 3000)
	}, 500)
}

constrain_heights();

update_forenames(kr_m_forenames_svg, kr_m_forenames_viewbox, "m", "kr")
update_forenames(kr_f_forenames_svg, kr_f_forenames_viewbox, "f", "kr")
update_forenames(br_m_forenames_svg, br_m_forenames_viewbox, "m", "br")
update_forenames(br_f_forenames_svg, br_f_forenames_viewbox, "f", "br")
update_surnames(kr_surnames_svg, kr_surnames, "kr")
update_surnames(br_surnames_svg, br_surnames, "br")