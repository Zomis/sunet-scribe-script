function download(filename, data) {
    let element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(data));
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function enableFollowAudio() {
    Array.prototype.slice.call(document.querySelectorAll(".q-toggle[aria-checked='false'] .q-toggle__label"))
        .filter(e => e.innerHTML.indexOf("Follow audio") >= 0)
        .forEach(e => e.click());
}
function highlightWordsWithoutTime() {
    let cells = getAllCellData(true);
    for (let cell of cells) {
        for (let span of cell.spans) {
            if (span.e == null && span.c.trim().length > 0) highlight(span, "yellow");
        }
    }
}

function clearHighlights() {
    let cells = getAllCellData(true);
    for (let cell of cells) {
        for (let span of cell.spans) {
            span.el.style.backgroundColor = "";
        }
    }
}

function highlight(span, color) {
    if (span.el.style.backgroundColor) {
        span.el.style.backgroundColor = "#ff00ff";
    } else span.el.style.backgroundColor = color;
}

function highlightDelayedWords(minDelay, color) {
    let cells = getAllCellData(true);
    for (let cell of cells) {
        let prev = null;
        for (let i = 0; i < cell.spans.length; i++) {
            let span = cell.spans[i];
            if (prev != null && prev.e != null) {
                let prevEnd = parseFloat(prev.e);
                let currStart = parseFloat(span.s);
                if (prevEnd + minDelay < currStart) {
                    highlight(span, color);
                }
            }
            if (span.e != null) prev = span;
        }
    }
}

function highlightEvery(delay, color) {
    let cells = getAllCellData(true);
    for (let cell of cells) {
        let first = null;
        let nextMark = delay;
        for (let i = 0; i < cell.spans.length; i++) {
            let span = cell.spans[i];
            if (first == null) {
                first = span;
                nextMark = parseFloat(first.s) + delay;
            } else {
                let currStart = parseFloat(span.s);
                if (currStart >= nextMark) {
                    highlight(span, color);
                    while (nextMark < currStart) {
                        nextMark += delay;
                    }
                }
            }
        }
    }
}

function filenameFromURL() {
    return new URLSearchParams(window.location.href).get("filename");
}

function person() {
    let filename = filenameFromURL();
    for (let p of ['A', 'B', 'C']) {
        if (filename.indexOf(`_${p}_`) >= 0) return p;
    }
    return "UNKNOWN";
}

async function syncTime() {
    let files = fileInput.files;
    if (!files?.length) {
        alert("No files selected, cannot adjust syncTime");
        return null;
    }
    let text = await files[0].text();

    let parser = new DOMParser();
    let xml = parser.parseFromString(text, "text/xml");
    let elements = xml.getElementsByTagName("MEDIA_DESCRIPTOR");
    let filename = filenameFromURL();
    for (let el of elements) {
        let rel = el.getAttribute("RELATIVE_MEDIA_URL");
        let time = el.getAttribute("TIME_ORIGIN");
        console.log(rel, time);
        if (rel.indexOf(filename) >= 0) {
            return parseInt(time, 10);
        }
    }
    return null;
}

function millisecondsToTimestamp(inputMs) {
    let seconds = Math.floor(inputMs / 1000);
    let h = Math.floor(seconds / 3600);
    let m = Math.floor(seconds / 60) % 60;
    let s = Math.floor(seconds) % 60;
    let ms = Math.floor(inputMs) % 1000;
    console.log(inputMs, seconds, '=>', h, m, s, ms);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
}

function adjustTime(timestamp, syncMs) {
    let h = parseInt(timestamp.substring(0, 2), 10);
    let m = parseInt(timestamp.substring(3, 5), 10);
    let s = parseInt(timestamp.substring(6, 8), 10);
    let ms = parseInt(timestamp.substring(9), 10);
    let total = (h * 3600 + m * 60 + s) * 1000 + ms;
    console.log("Adjust time", timestamp, h, m, s, ms, total, "++", syncMs);
    return millisecondsToTimestamp(total - syncMs);
}

const CSV_SEPARATOR = ";";
async function createCsv() {
    let syncMs = await syncTime();
    console.log("Sync result", syncMs);
    let cells = getAllCellData(false);
    let data = ["Annotation", "Tier", "Begin Time", "End Time"].join(CSV_SEPARATOR) + "\n";
    let tier = 'transcript_' + person();
    for (let cell of cells) {
        let text = cell.spans.map(s => s.c).join('');
        let beginTime = adjustTime(cell.start, syncMs);
        let endTime = adjustTime(cell.end, syncMs);
        data += [text, tier, beginTime, endTime].join(CSV_SEPARATOR) + "\n";
    }
    return data;
}

function getSpanData(span, includeElement) {
    let obj = {
        review: span.classList.contains("review-word"),
        s: span.getAttribute("data-s"),
        e: span.getAttribute("data-e"),
        c: span.innerHTML,
    }
    if (includeElement) obj.el = span;
    return obj;
}

function getCellData(cell, includeElement) {
    let start = cell.querySelector("div.transcript-time input:nth-child(1)").value;
    let end = cell.querySelector("div.transcript-time input:nth-last-child(1)").value;
    let spans = Array.prototype.slice.call(cell.querySelectorAll(".transcript-text span"));
    let spanData = spans.map(span => getSpanData(span, includeElement));
    return { start, end, spans: spanData };
}

let fileInput = document.createElement("input");
function addMenu() {
    let div = document.createElement("div");
    let labelDiv = document.createElement("div");
    let inputDiv = document.createElement("div");
    let buttonDiv = document.createElement("div");
    let input = document.createElement("input");
    fileInput.setAttribute("type", "file");
    div.append(fileInput);

    input.setAttribute("type", "number");
    input.setAttribute("min", 0);
    input.setAttribute("max", 2147483647);
    input.setAttribute("value", 1500);
    let infos = [
        "Yellow words indicate lack of timing information.",
        "Red words indicate a pause of at least x milliseconds before them.",
        "Highlight constant delay highlights a word every x milliseconds.",
        "Use the number input above to set the value for x",
    ];
    for (str of infos) {
        let info = document.createElement("p");
        info.appendChild(document.createTextNode(str));
        labelDiv.appendChild(info);
    }

    inputDiv.appendChild(input);
    let buttons = [
        {
            title: "Clear highlights",
            action: () => clearHighlights()
        },
        {
            title: "Highlight words with delay of x milliseconds before them",
            action: () => {
                let delay = parseInt(input.value, 10);
                clearHighlights();
                highlightDelayedWords(delay / 1000, "red");
                highlightWordsWithoutTime();
            },
        },
        {
            title: "Highlight constant delay of x milliseconds",
            action: () => {
                let delay = parseInt(input.value, 10);
                clearHighlights();
                highlightEvery(delay / 1000, "#00ffff");
            },
        },
        {
            title: "Download CSV for ELAN",
            action: () => {
                createCsv().then((result) => {
                    download("sunet-scribe-csv-for-elan.csv", result);
                });
            },
        },
        {
            title: "Download debug information",
            action: () => {
                download("sunet-scribe-debug.txt", JSON.stringify(getAllCellData(false)));
            }
        }
    ];
    for (let action of buttons) {
        let button = document.createElement("button");
        button.appendChild(document.createTextNode(action.title));
        button.classList.add("q-btn");
        button.onclick = action.action;
        buttonDiv.appendChild(button);
    }
    div.appendChild(labelDiv);
    div.appendChild(inputDiv);
    div.appendChild(buttonDiv);
    document.querySelector(".transcript-editor").insertAdjacentElement("afterbegin", div);
}

function getAllCellData(includeElement) {
    let cells = Array.prototype.slice.call(document.querySelectorAll("div.transcript-cell"));
    let cellData = cells.map(cell => getCellData(cell, includeElement));
    return cellData;
}

enableFollowAudio();
addMenu();
