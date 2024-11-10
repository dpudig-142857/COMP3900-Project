async function loadInfo(pathwayId) {
    try {
        const response = await fetch("pathways.json");
        const pathways = await response.json();

        const names = pathways
            .filter(p => p.pathway_id == pathwayId)
            .map(p => p.pathway_name)
            .sort((a, b) => {
                return a.localeCompare(b);
            });
        
        document.getElementById('pathwayId').innerText = `${pathwayId}`;
        
        if (names.length > 0) {
            document.title = `Pathway: ${names[0]}`;
            document.getElementById('nameTitle').innerText = names.length == 1 ? "Name:" : "Names:";
            document.getElementById('pathwayName').innerText = `${names.join("\n")}`;
        } else {
            document.getElementById('pathwayName').innerText = `Pathway not found`;
        }
        
        const keggUrl = `https://www.genome.jp/pathway/map${pathwayId}`;
        document.getElementById('keggLink').href = keggUrl;
    } catch (error) {
        console.error("Error fetching pathway data:", error);
    }
}

const urlParams = new URLSearchParams(window.location.search);
const pathwayId = urlParams.get('pathwayId');
if (pathwayId) {
    loadInfo(pathwayId);
} else {
    document.getElementById('pathwayId').innerText = "Pathway ID not provided.";
}
