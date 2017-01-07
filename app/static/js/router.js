function getHashUrl(settings) {
    cset = {
        "d": settings.numDays,
        "p": settings.dataPreference,
        "t": settings.tab
    };
    return "#!" + btoa(JSON.stringify(cset));
}

function processHashUrl() {
	settings = null;
	try {
		cset = JSON.parse(atob(window.location.hash.replace("#!", "")));
		settings = {
	        numDays: parseInt(cset.d),
	        dataPreference: cset.p,
	        tab: cset.t
	    };
	} catch(e) { }
	if(!settings) {
		console.log("failed to read route");
		settings = {
			numDays: 28,
			dataPreference: "3g",
			tab: "u"
		};
	}
	return settings;
}
