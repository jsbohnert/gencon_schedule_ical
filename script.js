function setMessage(msg) {
    document.getElementById("msg").textContent = msg;
}

function validateScheduleJson(obj) {

    const topLevelKeys = [
        "contact_id", "contact_name", "total_num_of_items",
        "total_num_of_pages", "page_size", "page", "data", "has_more"
    ];

    const eventKeys = [
        "end_date", "game_system", "role", "event_duration", "title",
        "max_players_unlimited", "room_name", "rules_edition", "event_type",
        "event_id", "my_ticket_count", "table_number", "tickets_available",
        "location", "max_players", "host_ids", "e_ticketed", "event_status",
        "start_date", "status"
    ];

    for (const key of topLevelKeys) {
        if (!obj.hasOwnProperty(key)) return false;
    }

    if (!Array.isArray(obj.data)) return false;

    for (const event of obj.data) {
        for (const key of eventKeys) {
            if (!event.hasOwnProperty(key)) return false;
        }
    }

    return true;
}

function generateDescription(eData) {
    let res = "";
    //user has more than one ticket is intersting
    if (eData["my_ticket_count"] != 1) {
        res += `${eData["my_ticket_count"]} tickets. `
    }
    if (eData["e_ticketed"] == true) {
        res += `(E-ticket).  `
    }
    return res;
}

function generateLocation(eData) {
    res = [];
    if (eData["location"]) {
        res.push(eData["location"]);
    }
    if (eData["room_name"]) {
        res.push(eData["room_name"]);
    }
    if (eData["table_number"]) {
        res.push(eData["table_number"]);
    }
    return res.join(" ");
}

function generateUrl(eData) {
    res = "https://gencon.com";
    if (eData["event_id"]) {
        res += `/events/${eData["event_id"]}`;
    }
    return res;
}

function createDownloadable(blob) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'gencon_events.ics';
    link.textContent = 'Download .ics';

    let doc = document.getElementById("dl-link");
    doc.appendChild(link);
}

function hideStep1() {
    document.getElementById('step1').classList.add("hidden");
}

function showStep2() {
    document.getElementById('step2').classList.remove("hidden");
}

function hideStep2() {
    document.getElementById('step2').classList.add("hidden");
}

function showStep3() {
    document.getElementById('step3').classList.remove("hidden");
}


function getSched() {
    let sched_url = document.getElementById('schedule-url').value;
    //checking url to see if its shaped right
    const re = new RegExp("https://www.gencon.com/schedules/([0-9]+).*");
    if (!re.test(sched_url)) {
        setMessage("Schedule URL does not appear to be valid.");
        return;
    }
    let reRes = re.exec(sched_url);
    const currentYear = new Date().getFullYear();
    let newUrl = `https://www.gencon.com/api/v2/schedule?c=indy${currentYear}&contact_id=${reRes[1]}`
    window.open(newUrl, "_blank");
    hideStep1();
    showStep2();

}

function process() {
    let txt = document.getElementById('txt').value;
    let obj;
    if (txt == "") {
        return;
    }
    try {
        obj = JSON.parse(txt);
    } catch (err) {
        setMessage("Error parsing text - did you copy in the correct schedule data from the API?");
        return;
    }

    if (!validateScheduleJson(obj)) {
        setMessage("Javascript doesnt match expected content. Did you copy in the correct schedule data from the API?");
        return;
    }

    // Generate VCALENDAR + VEVENTS
    const comp = new ICAL.Component(['vcalendar', [],
        []
    ]);
    comp.updatePropertyWithValue('prodid', '-//Gen Con Schedule Exporter//EN');
    comp.updatePropertyWithValue('version', '0.1');

    let eDataArr = obj["data"];

    for (let i = 0; i < eDataArr.length; i++) {
        let eData = eDataArr[i];

        const vevent = new ICAL.Component('vevent');
        const eventData = new ICAL.Event(vevent);

        eventData.summary = eData["title"];
        eventData.description = generateDescription(eData);
        eventData.location = generateLocation(eData);
        eventData.url = generateUrl(eData);
        eventData.startDate = ICAL.Time.fromString(eData["start_date"]);
        eventData.endDate = ICAL.Time.fromString(eData["end_date"]);
        comp.addSubcomponent(vevent);
    }

    const icsText = comp.toString();
    console.log(icsText);
    const blob = new Blob([icsText], {
        type: 'text/calendar'
    });

    createDownloadable(blob);
    hideStep2();
    showStep3();
};
