const emojiPriority = {
    "🟢": 3,
    "🟡": 2,
    "🟠": 1
};

async function loadResults() {
    const response = await fetch("sig_ranked.json");
    const data = await response.json();

    const sortedData = data.sort((a, b) => {
        const aEmoji = a.Metabolite.slice(-2);
        const bEmoji = b.Metabolite.slice(-2);
        const aPriority = emojiPriority[aEmoji] || 0;
        const bPriority = emojiPriority[bEmoji] || 0;
        if (aPriority != bPriority) {
            return bPriority - aPriority;
        } else {
            return a.Metabolite.localeCompare(b.Metabolite);
        }
    });

    const tbody = document.getElementById("tableBody");

    sortedData.forEach(row => {
        const tr = document.createElement("tr");
        tr.setAttribute("data-row", JSON.stringify(row).toLowerCase());

        tr.innerHTML = `
            <td>${row.Metabolite}</td>
            <td>${row.T_test_p_value}</td>
            <td>${row.Wilcoxon_p_value}</td>
            <td>${row.Permutation_p_value}</td>
            <td>${row.CVG_samples}</td>
            <td>${row.CVH_samples}</td>
            <td>${row.Significant_T_test}</td>
            <td>${row.Significant_Wilcoxon}</td>
            <td>${row.Significant_Permutation}</td>
        `;
        tbody.appendChild(tr);
    });
}

function filterResults() {
    const filter = document.getElementById("filter").value.toLowerCase();
    const rows = document.querySelectorAll("#resultsTable tbody tr");

    rows.forEach(row => {
        const rowData = row.getAttribute("data-row");
        row.style.display = rowData.includes(filter) ? "" : "none";
    });
}

function sortResults() {
    const method = document.getElementById("sortingDropdown").value || 1;
    const direction = document.getElementById('asc').checked ? "asc" :
                      document.getElementById('desc').checked ? "desc" : "asc";
    const tableBody = document.querySelector("#resultsTable tbody");
    const rows = Array.from(tableBody.querySelectorAll("tr"));
    const getNameData = (row) => {
        const metabolite = row.querySelector("td:nth-child(1)").textContent.trim().toLowerCase();
        const emoji = metabolite.slice(-2);
        const name = emojiPriority[emoji] ? metabolite.slice(0, -2).trim() : metabolite;
        const priority = emojiPriority[emoji] || 0;
        return { name, priority };
    };

    rows.sort((a, b) => {
        const { name: nameA, priority: priorityA } = getNameData(a);
        const { name: nameB, priority: priorityB } = getNameData(b);
        const compareNames = nameA.localeCompare(nameB);
        const compareEmoji = priorityB - priorityA;

        if (method == "0") {
            // Sort by Emoji
            if (direction === "asc") {
                return compareEmoji != 0 ? compareEmoji : compareNames;
            } else {
                return compareEmoji != 0 ? -compareEmoji : -compareNames;
            }
        } else if (method == "1") {
            // Sort by Name
            if (direction === "asc") {
                return compareNames != 0 ? compareNames : compareEmoji;
            } else {
                return compareNames != 0 ? -compareNames : -compareEmoji;
            }
        } else {
            // Sort by T-test, Wilcoxon, Permutation, CVG Samples or CVH Samples
            const numA = parseFloat(a.querySelector("td:nth-child("+ method + ")").textContent.trim());
            const numB = parseFloat(b.querySelector("td:nth-child("+ method + ")").textContent.trim());
            const compareNums = numB - numA;

            if (direction === "asc") {
                return compareNums != 0 ? compareNums :
                        compareEmoji != 0 ? compareEmoji : compareNames;
            } else {
                return compareNums != 0 ? -compareNums :
                        compareEmoji != 0 ? -compareEmoji : -compareNames;
            }
        }
    });

    // Append sorted rows back to the table body
    rows.forEach(row => tableBody.appendChild(row));
}

function changeOptions() {
    const method = document.getElementById("sortingDropdown").value;
    const direction = document.getElementById("sort-direction");
    const asc = document.getElementById("asc");
    const desc = document.getElementById("desc");

    direction.style.display = "none";

    if (method == "0") {
        // 3-0 or 0-3
        direction.style.display = "block";
        document.querySelector("label[for='asc']").textContent = "3 - 0";
        document.querySelector("label[for='desc']").textContent = "0 - 3";
    } else if (method == "1") {
        // A-Z or Z-A
        direction.style.display = "block";
        document.querySelector("label[for='asc']").textContent = "A - Z";
        document.querySelector("label[for='desc']").textContent = "Z - A";
    } else if (method == "2" || method == "3" || method == "4") {
        // 1-0 or 0-1
        direction.style.display = "block";
        document.querySelector("label[for='asc']").textContent = "1 - 0";
        document.querySelector("label[for='desc']").textContent = "0 - 1";
    } else {
        // high or low
        direction.style.display = "block";
        document.querySelector("label[for='asc']").textContent = "High";
        document.querySelector("label[for='desc']").textContent = "Low";
    }

    if (asc.checked) {
        asc.checked=true;
    } else if (desc.checked) {
        desc.checked=true;
    } else {
        asc.checked=true;
    }

    sortResults();
}

loadResults();