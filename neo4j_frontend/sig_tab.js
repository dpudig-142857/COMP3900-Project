async function loadResults() {
    const response = await fetch("sig_ranked.json");
    const data = await response.json();

    const emojiPriority = {
        "🟢": 3,
        "🟡": 2,
        "🟠": 1
    };

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

loadResults();