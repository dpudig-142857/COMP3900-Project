// Order of priority for status and regulation
const statusPriority = {
    "Sufficient Data": 3,
    "Constant Data": 2,
    "Insufficient Data": 1
};

const regPriority = {
    "up": 3,
    "down": 2,
    "undefined": 1
}

// loadResults
//      - Loads the results from the json file into the table
//
// Returns:
//      - nothing
//
async function loadResults() {
    const response = await fetch("sig_ranked.json");
    const data = await response.json();
    const tbody = document.getElementById("tableBody");

    data.forEach(row => {
        const tr = document.createElement("tr");
        tr.setAttribute("data-row", JSON.stringify(row).toLowerCase());

        let id = "";
        let regulation = "";
        let style = "";
        if (row.Regulation == "Upregulated") {
            id = "up";
            regulation = "➜";
            style = "font-size: 24px; color: #00ff00; text-align: center; transform: rotate(-90deg);";
        } else if (row.Regulation == "Downregulated") {
            id = "down";
            regulation = "➜";
            style = "font-size: 24px; color: #ff0000; text-align: center; transform: rotate(90deg);";
        } else {
            id = "undefined";
            regulation = row.Regulation;
            style = "text-align: center;";
        }

        tr.innerHTML = `
            <td>${row.Metabolite}</td>
            <td style="text-align: center;">${row.FoldChange}</td>
            <td style="text-align: center;">${row.Log2FoldChange}</td>
            <td style="text-align: center;">${row.PValue}</td>
            <td style="text-align: center;">${row.CVG_Count}</td>
            <td style="text-align: center;">${row.CVH_Count}</td>
            <td style="text-align: center;">${row.Status}</td>
            <td id="${id}" style="${style}">${regulation}</td>
            <td style="text-align: center;">${row.Source}</td>
        `;
        tbody.appendChild(tr);
    });
}

// filterResults
//      - Filters the results to find the given filter text
//
// Returns:
//      - nothing
//
function filterResults() {
    const filter = document.getElementById("filter").value.toLowerCase();
    const rows = document.querySelectorAll("#resultsTable tbody tr");

    rows.forEach(row => {
        const rowData = row.getAttribute("data-row");
        row.style.display = rowData.includes(filter) ? "" : "none";
    });
}

// filterByPValue
//      - Filters and displays results by p-value thresholds
//      - Can be used in conjunction with sort by p-value to order metabolites
//
// Returns:
//      - nothing
//
function filterByPValue() {
    const pValueThreshold = parseFloat(document.getElementById("pValueInput").value);
    const rows = document.getElementById("tableBody").getElementsByTagName("tr");

    for (let row of rows) {
        const pValueText = row.querySelector("td:nth-child(4)").textContent.trim();
        const pValue = parseFloat(pValueText);

        if (!isNaN(pValue) && pValue <= pValueThreshold) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    }
}

// sortResults
//      - Sorts the results on the method given by the dropdown box and the direction buttons
//
// Returns:
//      - nothing
//
function sortResults() {
    const method = document.getElementById("sortingDropdown").value || 1;
    const direction = document.getElementById('asc').checked ? "asc" :
                      document.getElementById('desc').checked ? "desc" : "asc";
    const tableBody = document.querySelector("#resultsTable tbody");
    const rows = Array.from(tableBody.querySelectorAll("tr"));

    rows.sort((a, b) => {
        const nameA = a.querySelector("td:nth-child(1)").textContent.trim().toLowerCase();
        const nameB = b.querySelector("td:nth-child(1)").textContent.trim().toLowerCase();
        const compareNames = nameA.localeCompare(nameB);

        if (method == "1") {
            // Sort by Name
            return direction == "asc" ? compareNames : -compareNames;
        } else if (method == "7") {
            // Sort by Status
            const statusA = a.querySelector("td:nth-child(7)").textContent.trim();
            const statusB = b.querySelector("td:nth-child(7)").textContent.trim();
            const compareStatus = statusPriority[statusB] - statusPriority[statusA];
            if (direction == "asc") {
                return compareStatus != 0 ? compareStatus : compareNames;
            } else {
                return compareStatus != 0 ? -compareStatus : -compareNames;
            }
        } else if (method == "8") {
            // Sort by Regulation
            const regA = a.querySelector("td:nth-child(8)").id;
            const regB = b.querySelector("td:nth-child(8)").id;
            const compareReg = regPriority[regB] - regPriority[regA];
            if (direction == "asc") {
                return compareReg != 0 ? compareReg : compareNames;
            } else {
                return compareReg != 0 ? -compareReg : -compareNames;
            }
        } else if (method == "9") {
            // Sort by Source
            const srcA = a.querySelector("td:nth-child(9)").textContent.trim();
            const srcB = b.querySelector("td:nth-child(9)").textContent.trim();
            const compareSrc = srcA.localeCompare(srcB);
            if (direction == "asc") {
                return compareSrc != 0 ? compareSrc : compareNames;
            } else {
                return compareSrc != 0 ? -compareSrc : -compareNames;
            }
        } else {
            // Sort by Fold Change, log_2(Fold Change), P-Value, CVG Count or CVH Count
            let numA = a.querySelector("td:nth-child(" + method + ")").textContent.trim();
            let numB = b.querySelector("td:nth-child(" + method + ")").textContent.trim();
            if (numA == "undefined") numA = -100;
            if (numB == "undefined") numB = -100;
            const compareNums = numB - numA;
            if (direction == "asc") {
                return compareNums != 0 ? compareNums : compareNames;
            } else {
                return compareNums != 0 ? -compareNums : -compareNames;
            }
        }
    });

    // Append sorted rows back to the table body
    rows.forEach(row => tableBody.appendChild(row));
}

// changeOptions
//      - Changes the names of the direction buttons to match the current sorting method
//
// Returns:
//      - nothing
//
function changeOptions() {
    const method = document.getElementById("sortingDropdown").value;
    const direction = document.getElementById("sort-direction");
    const asc = document.getElementById("asc");
    const desc = document.getElementById("desc");
    direction.style.display = "block";

    if (method == "1" || method == "9") {
        // Sort by Name or Source (A-Z or Z-A)
        document.querySelector("label[for='asc']").textContent = "A - Z";
        document.querySelector("label[for='desc']").textContent = "Z - A";
    } else if (method == "4") {
        // Sort by P-value
        document.getElementById("pValueInput").style.display = "block";
        document.getElementById("pValueInput").focus();
        document.querySelector("label[for='asc']").textContent = "Descending";
        document.querySelector("label[for='desc']").textContent = "Ascending";
    } else if (method == "5" || method == "6") {
        // Sort by CVG Samples or CVH Samples (High-Low or Low-High)
        document.querySelector("label[for='asc']").textContent = "High";
        document.querySelector("label[for='desc']").textContent = "Low";
    } else if (method == "7") {
        // Sort by Status (Suff-Insuff or Insuff-Suff)
        document.querySelector("label[for='asc']").textContent = "Sufficient";
        document.querySelector("label[for='desc']").textContent = "Insufficient";
    } else if (method == "8") {
        // Sort by Regulation (Up-Down or Down-Up)
        document.querySelector("label[for='asc']").textContent = "Up";
        document.querySelector("label[for='desc']").textContent = "Down";
    } else {
        // Sort by Fold Change or log_2(Fold Change) (Asc or Desc)
        document.querySelector("label[for='asc']").textContent = "Ascending";
        document.querySelector("label[for='desc']").textContent = "Descending";
    }

    // Keep the same option for the direction
    if (asc.checked || desc.checked) sortResults();

    sortResults();
}

loadResults();