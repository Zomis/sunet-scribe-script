// Turn on follow-audio.
// (Uncertain words can also be detected and exported)

function download(data) {
    let element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(data));
    element.setAttribute("download", "sunet-scribe.txt");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function getSpanData(span) {
    return {
        review: span.classList.contains("review-word"),
        s: span.getAttribute("data-s"),
        e: span.getAttribute("data-e"),
        c: span.innerHTML,
    }
}

function getCellData(cell) {
    let start = cell.querySelector("div.transcript-time input:nth-child(1)").value;
    let end = cell.querySelector("div.transcript-time input:nth-last-child(1)").value;
    let spans = Array.prototype.slice.call(cell.querySelectorAll(".transcript-text span"));
    let spanData = spans.map(span => getSpanData(span));
    return { start, end, spanData };
}

cells = Array.prototype.slice.call(document.querySelectorAll("div.transcript-cell"));
cellData = cells.map(cell => getCellData(cell));
download(JSON.stringify(cellData));

/*
data-edit
data-s
data-e
data-review
*/

