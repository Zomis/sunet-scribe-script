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
    let labelDiv = document.createElement("div");
    let inputDiv = document.createElement("div");
    let buttonDiv = document.createElement("div");
    let input = document.createElement("input");
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
            title: "Download debug information",
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

function downloadAllData() {
    download(JSON.stringify(getAllCellData(false)));
}

enableFollowAudio();
addMenu();
