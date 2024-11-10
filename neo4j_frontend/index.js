// Neo4j HTTP endpoint for Cypher transaction API
const neo4j_http_url = "http://localhost:7474/db/neo4j/tx"
const neo4jUsername = "neo4j"
const neo4jPassword = "password"

// Used for drawing nodes and arrows later on
const circleSize = 30
const arrowHeight = 5
const arrowWidth = 5

let searchedMetabolite = ""

// Fetch all of the data from the json files
let compoundsData = [];
let pathwaysData = [];
fetch('compounds.json')
    .then(response => response.json())
    .then(data => {
        compoundsData = data;
        console.log("Compounds data loaded:", compoundsData);
    })
    .catch(error => console.error("Error loading compounds data:", error));

fetch('pathways.json')
    .then(response => response.json())
    .then(data => {
        pathwaysData = data;
        console.log("Pathways data loaded:", pathwaysData);
    })
    .catch(error => console.error("Error loading pathways data:", error));

// getCompoundId
//      - If the compound exists, gets the compound ID from the name
//
// Parameters:
//      - compoundName (string) - the name of the compound that may or may not exist
//
// Returns:
//      - the id of the compound or
//      - null
//
function getCompoundId(compoundName) {
    const compound = compoundsData.find(c => c.compound_name === compoundName);
    return compound ? compound.compound_id : null;
}

// getPathwayId
//      - If the pathway exists, gets the pathway ID from the name
//
// Parameters:
//      - pathwayName (string) - the name of the pathway that may or may not exist
//
// Returns:
//      - the id of the pathway or
//      - null
//
function getPathwayId(pathwayName) {
    const name = pathwayName.split(";");
    const pathway = pathwaysData.find(p => p.pathway_name === name[0]);
    return pathway ? pathway.pathway_id : null;
}

// openLinksPage
//      - Opens the specialised link for either compounds or pathways and displays its information
//
// Parameters:
//      - isCompound (bool) - true if it is a compound, false if it is a pathway
//      - id (string) - the id of the compound or pathway
//      - name (string) - the name of the compound or pathway
//
// Returns:
//      - nothing
//
function openLinksPage(isCompound, id, name) {
    if (isCompound) {
        const url = `compound_tab.html?compoundId=${id}`;
        console.log(`Opening compound page: ${url}`);
        window.open(url, "_blank");
    } else {
        const url = `pathway_tab.html?pathwayId=${id}`;
        console.log(`Opening pathway page: ${url}`);
        window.open(url, "_blank");
    }
}

// submitQuery
//      - Submits Query to Neo4j based on given metabolite and number of neighbours
//
// Returns:
//      - nothing
// 
const submitQuery = () => {
    // Create new, empty objects to hold the nodes and relationships returned by the query results
    let nodeItemMap = {}
    let linkItemMap = {}

    // Contents of the query text field
    searchedMetabolite = document.querySelector('#queryContainer').value;
    neighbors = document.querySelector('#neighborsDropdown').value;

    // Generate Cypher Query
    let start = `match (m0)`;
    let middle = ` where toLower(m0.name) = toLower('${searchedMetabolite}')`;
    let end = ` return m0`;
    for (let i = 0; i < neighbors; i++) {
        start += `-[r${i+1}:LINKED]-(m${i+1})`;
        end += `,r${i+1},m${i+1}`;
    }
    const cypherString = start + middle + end + ` limit 300`;

    // make POST request with auth headers
    fetch(neo4j_http_url, {
        method: 'POST',
        // authentication using the username and password of the user in Neo4j
        headers: {
            "Authorization": "Basic " + btoa(`${neo4jUsername}:${neo4jPassword}`),
            "Content-Type": "application/json",
            "Accept": "application/json;charset=UTF-8",
        },
        // Formatted request for Neo4j's Cypher Transaction API with generated query included
        // https://neo4j.com/docs/http-api/current/actions/query-format/
        // generated query is formatted to be valid JSON for insertion into request body
        body: '{"statements":[{"statement":"' + cypherString.replace(/(\r\n|\n|\r)/gm, "\\n").replace(/"/g, '\\"') + '", "resultDataContents":["graph", "row"]}]}'
    })
        .then(res => res.json())
        .then(data => { // usable data from response JSON
            
            // if errors present in the response from Neo4j, propagate alert() dialog box with the error
            if (data.errors != null && data.errors.length > 0) {
                alert(`Error:${data.errors[0].message}(${data.errors[0].code})`);
            }
            // if results within valid data are not null or empty, extract the returned nodes/relationships into nodeItemMap and linkItemMap respectively
            if (data.results != null && data.results.length > 0 && data.results[0].data != null && data.results[0].data.length > 0) {
                let neo4jDataItmArray = data.results[0].data;
                neo4jDataItmArray.forEach(function (dataItem) { // iterate through all items in the embedded 'results' element returned from Neo4j, https://neo4j.com/docs/http-api/current/actions/result-format/
                    // Node
                    if (dataItem.graph.nodes != null && dataItem.graph.nodes.length > 0) {
                        let neo4jNodeItmArray = dataItem.graph.nodes; // all nodes present in the results item
                        neo4jNodeItmArray.forEach(function (nodeItm) {
                            if (!(nodeItm.id in nodeItemMap)) // if node is not yet present, create new entry in nodeItemMap whose key is the node ID and value is the node itself
                                nodeItemMap[nodeItm.id] = nodeItm;
                        });
                    }
                    // Link, interchangeably called a relationship
                    if (dataItem.graph.relationships != null && dataItem.graph.relationships.length > 0) {
                        let neo4jLinkItmArray = dataItem.graph.relationships; // all relationships present in the results item
                        neo4jLinkItmArray.forEach(function (linkItm) {
                            if (!(linkItm.id in linkItemMap)) { // if link is not yet present, create new entry in linkItemMap whose key is the link ID and value is the link itself
                                // D3 force layout graph uses 'startNode' and 'endNode' to determine link start/end points, these are called 'source' and 'target' in JSON results from Neo4j
                                linkItm.source = linkItm.startNode;
                                linkItm.target = linkItm.endNode;
                                linkItemMap[linkItm.id] = linkItm;
                            }
                        });
                    }
                });
            }

            // update the D3 force layout graph with the properly formatted lists of nodes and links from Neo4j
            updateGraph(Object.values(nodeItemMap), Object.values(linkItemMap));
        });
}

// openLinksPage
//      - Creates a new D3 force simulation with the nodes and links returned from a query to Neo4j for display on the canvas element
//
// Parameters:
//      - nodes (array) - all of the nodes on the graph
//      - links (array) - all of the links between nodes on the graph
//
// Returns:
//      - nothing
//
const updateGraph = (nodes, links) => {
    const canvas = document.querySelector('canvas');
    const width = canvas.width;
    const height = canvas.height;
    let transform = d3.zoomIdentity;

    // This object sets the force between links and instructs the below simulation to use the links provided from query results, https://github.com/d3/d3-force#links
    const d3LinkForce = d3.forceLink()
        .distance(50)
        .strength(0.1)
        .links(links)
        .id(d => d.id);

    // This defines a new D3 Force Simulation which controls the physical behavior of how nodes and links interact.
    // https://github.com/d3/d3-force#simulation
    
    let simulation = new d3.forceSimulation()
        .force('chargeForce', d3.forceManyBody().strength())
        .force('collideForce', d3.forceCollide(circleSize * 3))
        .force("center", d3.forceCenter(width / 2, height / 2))

    // Here, the simulation is instructed to use the nodes returned from the query results and to render links using the force defined above
    simulation
        .nodes(nodes)
        .force("linkForce", d3LinkForce)
        .on("tick",simulationUpdate) // on each tick of the simulation's internal timer, call simulationUpdate()
        .restart();

    d3.select(canvas)
        .call(d3.zoom()
            .scaleExtent([0.05, 10])
            .on('zoom', zoomed));

    function zoomed(e) {
        transform = e.transform;
        simulationUpdate();
    }

    // Zoom Buttons
    const zoom = d3.zoom()
        .scaleExtent([0.5, 5])
        .on('zoom', (event) => {
            transform = event.transform;
            simulationUpdate();
        });

    // Call zoom on the canvas
    d3.select(canvas).call(zoom);

    // Zoom control button functions
    document.getElementById('zoomInBtn').onclick = () => zoom.scaleBy(d3.select(canvas).transition().duration(1000), 1.2);
    document.getElementById('zoomOutBtn').onclick = () => zoom.scaleBy(d3.select(canvas).transition().duration(500), 0.8);
    document.getElementById('resetZoomBtn').onclick = () => zoom.transform(d3.select(canvas).transition().duration(500), d3.zoomIdentity);

    // Save the current canvas function
    document.getElementById('saveCanvasBtn').onclick = function() {
        const canvas = document.getElementById('graphCanvas');
        console.log(canvas); 

        if (canvas) {
            console.log('Canvas found:', canvas);
        } else {
            console.error('Canvas element with ID "graphCanvas" not found.');
        }
        const dataURL = canvas.toDataURL('image/png');

        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'canvas_image.png';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // The canvas is cleared and then instructed to draw each node and link with updated locations per the physical force simulation.
    function simulationUpdate() {
        let context = canvas.getContext('2d');
        context.save(); // save canvas state, only rerender what's needed
        context.clearRect(0, 0, width, height);
        context.translate(transform.x, transform.y);
        context.scale(transform.k, transform.k);

        // Draw links
        links.forEach(function(d) {
            context.beginPath();
            const deltaX = d.target.x - d.source.x;
            const deltaY = d.target.y - d.source.y;
            const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const cosTheta = deltaX / dist;
            const sinTheta = deltaY / dist;
            const sourceX = d.source.x + (circleSize * cosTheta);
            const sourceY = d.source.y + (circleSize * sinTheta);
            const targetX = d.target.x - (circleSize * cosTheta);
            const targetY = d.target.y - (circleSize * sinTheta);

            const arrowLeftX = targetX - (arrowHeight * sinTheta) - (arrowWidth * cosTheta);
            const arrowLeftY = targetY + (arrowHeight * cosTheta) - (arrowWidth * sinTheta);
            const arrowRightX = targetX + (arrowHeight * sinTheta) - (arrowWidth * cosTheta);
            const arrowRightY = targetY - (arrowHeight * cosTheta) - (arrowWidth * sinTheta);

            // Each link is drawn using SVG-format data to easily draw the dynamically generated arc
            let path = new Path2D(`M${sourceX},${sourceY} ${targetX},${targetY} M${targetX},${targetY} L${arrowLeftX},${arrowLeftY} L${arrowRightX},${arrowRightY} Z`);

            context.closePath();
            context.stroke(path);
        });

        // Draw nodes
        nodes.forEach(function(d) {
            context.beginPath();
            context.arc(d.x, d.y, circleSize, 0, 2 * Math.PI);

            // fill color
            if (d.properties.name.toLowerCase() == searchedMetabolite.toLowerCase()) {
                context.fillStyle = '#A865B5';
            } else if (d.labels && d.labels.includes('METABOLITE')) {
                context.fillStyle = '#4EA8E5';
            } else if (d.labels && d.labels.includes('PATHWAY')) {
                context.fillStyle = '#6df1a9';
            } else {
                context.fillStyle = '#000000';
            }
            context.fill()

            context.textAlign = "center"
            context.textBaseline = "middle"
            context.fillStyle = "#000000"
            context.font = '12px Arial'

            // Limit text length and add ellipsis if necessary
            const maxLabelLength = 10;
            let labelText = d.properties.name || d.properties.title || "";
            if (labelText.length > maxLabelLength - 3) {
                labelText = labelText.substring(0, maxLabelLength - 3) + "...";
            }

            // Draws the appropriate text on the node
            context.fillText(labelText, d.x, d.y)
            context.closePath();
            context.stroke();
        });

        context.restore();
    }

    canvas.addEventListener('mousemove', event => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = (event.clientX - rect.left - transform.x) / transform.k;
        const mouseY = (event.clientY - rect.top - transform.y) / transform.k;
    
        let isHoveringOverNode = false;
    
        nodes.forEach(node => {
            const dx = mouseX - node.x;
            const dy = mouseY - node.y;
            if (Math.sqrt(dx * dx + dy * dy) < circleSize) {
                isHoveringOverNode = true; // If the mouse is over a node
            }
        });
    
        // Change cursor style based on hover state
        canvas.style.cursor = isHoveringOverNode ? 'pointer' : 'default';
    });

    canvas.addEventListener('click', event => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = (event.clientX - rect.left - transform.x) / transform.k;
        const mouseY = (event.clientY - rect.top - transform.y) / transform.k;
    
        nodes.forEach(node => {
            const dx = mouseX - node.x;
            const dy = mouseY - node.y;
            if (Math.sqrt(dx * dx + dy * dy) < circleSize) {
                const nodeName = node.properties.name;
                console.log("Node clicked:", nodeName);
    
                const compoundId = getCompoundId(nodeName);
                const pathwayId = getPathwayId(nodeName);
                console.log("Compound = " + compoundId + "\nPathway = " + pathwayId);
    
                if (compoundId) {
                    openLinksPage(true, compoundId, nodeName);
                } else if (pathwayId) {
                    openLinksPage(false, pathwayId, nodeName);
                } else {
                    alert("Link not available for this node.");
                }
            }
        });
    });
}

// responsiveCanvasSizer
//      - Resizes the canvas to fit the user's screen
//
// Returns:
//      - nothing
//
function responsiveCanvasSizer() {
    const canvas = document.querySelector('canvas')
    const rect = canvas.getBoundingClientRect()

    // Set the "actual" size of the canvas
    canvas.width = rect.width
    canvas.height = rect.height

    // Set the "drawn" size of the canvas
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
}
