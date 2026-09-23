function download(data) {
    let element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(data));
    element.setAttribute("download", "sunet-scribe.txt");
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
            if (span.e == null && span.c.trim().length > 0) span.el.style.backgroundColor = "yellow";
        }
    }
}

function highlightDelayedWords(minDelay) {
    let cells = getAllCellData(true);
    for (let cell of cells) {
        let prev = null;
        for (let i = 0; i < cell.spans.length; i++) {
            let span = cell.spans[i];
            if (prev != null && prev.e != null) {
                let prevEnd = parseFloat(prev.e);
                let currStart = parseFloat(span.s);
                if (prevEnd + minDelay < currStart) {
                    span.el.style.backgroundColor = "red";
                }
            }
            if (span.e != null) prev = span;
        }
    }
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

function addMenu() {
    let div = document.createElement("div");
    let info = document.createElement("span");
    info.appendChild(document.createTextNode("Yellow words indicate lack of timing information. Red words indicate a pause before them."));
    let buttons = [
        {
            title: "Highlight words",
            action: () => {
                highlightDelayedWords(1.5);
                highlightWordsWithoutTime();
            },
        },
        {
            title: "Download all",
            action: () => {
                downloadAllData();
            }
        }
    ];
    for (let action of buttons) {
        let button = document.createElement("button");
        button.appendChild(document.createTextNode(action.title));
        button.classList.add("q-btn");
        button.onclick = action.action;
        div.appendChild(button);
    }
    div.appendChild(info);
    document.querySelector(".transcript-editor").insertAdjacentElement("afterbegin", div);
}

function getAllCellData(includeElement) {
    let cells = Array.prototype.slice.call(document.querySelectorAll("div.transcript-cell"));
    let cellData = cells.map(cell => getCellData(cell, includeElement));
    return cellData;
}

function downloadAllData() {
    download(JSON.stringify(getAllCellData(false)));
}

enableFollowAudio();
addMenu();
