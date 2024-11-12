function createHistory(link, entry) {
    const metabolite = encodeURIComponent(entry.metabolite);
    const neighbors = encodeURIComponent(entry.neighbors);
    const metabolite2 = encodeURIComponent(entry.metabolite2);
    if (entry.type == 1) {
        link.href = `index.html?metabolite=${metabolite}&neighbors=${neighbors}`;
        link.innerHTML = `
            <span class="history-info" id="history_one">Metabolite: ${entry.metabolite}</span>
            <span class="history-separator">|</span>
            <span class="history-info" id="history_two">Neighbors: ${entry.neighbors}</span>
            <span class="history-separator">|</span>
            <span class="history-info"">Date: ${entry.timestamp}</span>
        `;
    } else if (entry.type == 2) {
        link.href = `index.html?pathway=${metabolite}&neighbors=${neighbors}`;
        link.innerHTML = `
            <span class="history-info" id="history_one">Pathway: ${entry.metabolite}</span>
            <span class="history-separator">|</span>
            <span class="history-info" id="history_two">Neighbors: ${entry.neighbors}</span>
            <span class="history-separator">|</span>
            <span class="history-info"">Date: ${entry.timestamp}</span>
        `;
    } else if (entry.type == 3) {
        link.href = `index.html?metaboliteOne=${metabolite}&metaboliteTwo=${metabolite2}`;
        link.innerHTML = `
            <span class="history-info" id="history_one">Metabolite 1: ${entry.metabolite}</span>
            <span class="history-separator">|</span>
            <span class="history-info" id="history_two">Metabolite 2: ${entry.metabolite2}</span>
            <span class="history-separator">|</span>
            <span class="history-info"">Date: ${entry.timestamp}</span>
        `;
    } else {
        console.log("Error - not valid history type");
    }
    link.setAttribute("data-type", `${entry.type}`);
}

/* Show history info */
/*document.addEventListener('DOMContentLoaded', () => {
    const historyList = document.getElementById('historyList');
    const noHistory = document.getElementById('noHistory');
    const queryHistory = JSON.parse(localStorage.getItem('queryHistory')) || [];

    queryHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // if nothing say no query history available
    if (queryHistory.length === 0) {
        noHistory.style.display = 'block';
    } else {
        noHistory.style.display = 'none';
        queryHistory.forEach(entry => {
            const listItem = document.createElement('li');

            // Create clickable box for each history item
            const link = document.createElement('a');
            createHistory(link, entry);
            
            link.classList.add('history-box');
            
            // Append the links
            listItem.appendChild(link);
            historyList.appendChild(listItem);
        });
    }
});*/

document.addEventListener('DOMContentLoaded', () => {
    loadAndDisplayHistory();
});

/* Load and display sorted history */
function loadAndDisplayHistory() {
    const historyList = document.getElementById('historyList');
    const noHistory = document.getElementById('noHistory');
    let queryHistory = JSON.parse(localStorage.getItem('queryHistory')) || [];

    // Default sort by date initially
    queryHistory.sort(function(a, b) {
        const compareTypes = a.type - b.type;
        const compareDates = b.timestamp.localeCompare(a.timestamp);
        return compareTypes != 0 ? compareTypes : compareDates;
    });

    // Display message if there is no history
    if (queryHistory.length === 0) {
        noHistory.style.display = 'block';
    } else {
        noHistory.style.display = 'none';
        historyList.innerHTML = ''; // Clear the list before rendering
        queryHistory.forEach(entry => {
            const listItem = document.createElement('li');

            const link = document.createElement('a');
            createHistory(link, entry);
            link.classList.add('history-box');
            
            listItem.appendChild(link);
            historyList.appendChild(listItem);
        });
    }
}

function sortHistory() {
    const selectedType = document.getElementById("typeDropdown").value;
    const selectedSort = document.getElementById("sortingDropdown").value;
    let queryHistory = JSON.parse(localStorage.getItem('queryHistory')) || [];

    // Define sorting logic based on the selected option
    queryHistory.sort((a, b) => {
        if (selectedType == 0) {
            const compareTypes = a.type - b.type;
            const compareDates = b.timestamp.localeCompare(a.timestamp);
            if (selectedSort == 0) {
                return compareTypes != 0 ? compareTypes : compareDates;
            } else if (selectedSort == 1) {
                if (a.type != 1 && b.type == 1) return 1;
                if (a.type == 1 && b.type != 1) return -1;
                const compareNames = a.metabolite.localeCompare(b.metabolite);
                return compareNames != 0 ? compareNames : compareDates;
            } else if (selectedSort == 2) {
                if (a.type != 2 && b.type == 2) return 1;
                if (a.type == 2 && b.type != 2) return -1;
                const compareNames = a.metabolite.localeCompare(b.metabolite);
                return compareNames != 0 ? compareNames : compareDates;
            } else if (selectedSort == 3) {
                if (a.type != 3 && b.type == 3) return 1;
                if (a.type == 3 && b.type != 3) return -1;
                const compareNames = a.metabolite.localeCompare(b.metabolite);
                return compareNames != 0 ? compareNames : compareDates;
            } else if (selectedSort == 4) {
                if (!a.metabolite2 && b.metabolite2) return 1;
                if (a.metabolite2 && !b.metabolite2) return -1;
                const compareNames = a.metabolite2.localeCompare(b.metabolite2);
                return compareNames != 0 ? compareNames : compareDates;
            } else if (selectedSort == 5) {
                const neighborsA = parseFloat(a.neighbors);
                const neighborsB = parseFloat(b.neighbors);
                if (isNaN(neighborsA)) return 1;
                if (isNaN(neighborsB)) return -1;
                const compareNeigh = neighborsA - neighborsB;
                return compareNeigh != 0 ? compareNeigh : compareDates;
            } else if (selectedSort == 6) {
                return compareDates != 0 ? compareDates : compareTypes;
            } else {
                console.log("Error - invalid sort");
            }
        } else if (selectedType == 1 || selectedType == 2) {
            const compareNames = a.metabolite.localeCompare(b.metabolite);
            const compareDates = b.timestamp.localeCompare(a.timestamp);
            if (selectedSort == 0) {
                // Sort by Metabolite
                return compareNames != 0 ? compareNames : compareDates;
            } else if (selectedSort == 1) {
                // Sort by Neighbours
                const compare = a.neighbors - b.neighbors;
                return compare != 0 ? compare : compareDates;
            } else if (selectedSort == 2) {
                // Sort by Dates
                return compareDates != 0 ? compareDates : compareNames;
            } else {
                console.log("Error - invalid sort");
            }
       } else if (selectedType == 3) {
            const compareNames1 = a.metabolite.localeCompare(b.metabolite);
            const compareNames2 = a.metabolite2.localeCompare(b.metabolite2);
            const compareDates = b.timestamp.localeCompare(a.timestamp);
            if (selectedSort == 0) {
                return compareNames1 != 0 ? compareNames1 : compareDates;
            } else if (selectedSort == 1) {
                return compareNames2 != 0 ? compareNames2 : compareDates;
            } else if (selectedSort == 2) {
                return compareDates != 0 ? compareDates :
                    compareNames1 != 0 ? compareNames1 : compareNames2;
            } else {
                console.log("Error - invalid sort");
            }
        } else {
            console.log("Error - invalid type");
        }
    });

    // Clear and re-render sorted history
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = ''; // Clear current list
    queryHistory.forEach(entry => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        createHistory(link, entry);
        link.classList.add('history-box');
        listItem.appendChild(link);
        historyList.appendChild(listItem);
    });

    updateHistory();
}

/* Delete history */
function deleteHistory() {
    localStorage.removeItem('queryHistory');
    document.getElementById('historyList').innerHTML = '';
    document.getElementById('noHistory').style.display = 'block';
}

function sortOptions() {
    const selectedType = document.getElementById("typeDropdown").value;
    const sortingDropdown = document.getElementById("sortingDropdown");

    updateHistory();

    // Clear existing sorting options
    sortingDropdown.innerHTML = `<option value="" selected disabled>Sort by..</option>`;

    // Define new sorting options based on selected type
    let sortOptions = [];
    if (selectedType == 0) {
        sortOptions = [
            { value: "0", label: `Type` },
            { value: "1", label: `Metabolite` },
            { value: "2", label: `Pathway` },
            { value: "3", label: `Metabolite 1` },
            { value: "4", label: `Metabolite 2` },
            { value: "5", label: `Neighbours`},
            { value: "6", label: `Date`}
        ];
    } else if (selectedType == 1) {
        sortOptions = [
            { value: "0", label: `Metabolite` },
            { value: "1", label: `Neighbours` },
            { value: "2", label: `Date` }
        ];
    } else if (selectedType == 2) {
        sortOptions = [
            { value: "0", label: `Pathway` },
            { value: "1", label: `Neighbours` },
            { value: "2", label: `Date` }
        ];
    } else if (selectedType == 3) {
        sortOptions = [
            { value: "0", label: `Metabolite 1` },
            { value: "1", label: `Metabolite 2` },
            { value: "2", label: `Date` }
        ];
    }

    // Populate sorting dropdown with new options
    sortOptions.forEach(option => {
        const optElement = document.createElement("option");
        optElement.value = option.value;
        optElement.textContent = option.label;
        sortingDropdown.appendChild(optElement);
    });
}


function updateHistory() {
    const selectedType = document.getElementById("typeDropdown").value;
    const queryHistory = document.querySelectorAll('#historyList li a');

    queryHistory.forEach(item => {
        if (selectedType == 0 || item.getAttribute("data-type") === selectedType) {
            item.parentElement.style.display = "list-item";
        } else {
            item.parentElement.style.display = "none";
        }
    });
}