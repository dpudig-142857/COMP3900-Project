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
    const method = document.getElementById("sortingDropdown").value;
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
        
        if (method == "0") {
            // Sort by Name
            const compare = nameA.localeCompare(nameB);
            return compare != 0 ? compare : priorityB - priorityA;
        } else if (method == "1") {
            // Sort by Emoji
            const compare = priorityB - priorityA;
            return compare != 0 ? compare : nameA.localeCompare(nameB);
        } else {
            // Sort by T-test, Wilcoxon, Permutation, CVG Samples and CVH Samples
            const numA = parseFloat(a.querySelector("td:nth-child("+ method + ")").textContent.trim());
            const numB = parseFloat(b.querySelector("td:nth-child("+ method + ")").textContent.trim());

            const compare = numB - numA;
            const priority = priorityB - priorityA;
            return compare != 0 ? compare : priority != 0 ? priority : nameA.localeCompare(nameB);
        }
    });

    // Append sorted rows back to the table body
    rows.forEach(row => tableBody.appendChild(row));
}

loadResults();