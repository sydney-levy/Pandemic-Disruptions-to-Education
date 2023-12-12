// Utilized code from the following websites:
// https://observablehq.com/@d3/bubble-chart/2
// https://vallandingham.me/bubble_charts_with_d3v4.html

class BubbleChart {
    constructor(parentElement, data) {
        // Store the parent element and data
        this.parentElement = parentElement;
        this.data = data;

        // Initialize the visualization
        this.initVis();
    }

    initVis() {
        let vis = this;

        // Initialize display data
        vis.displayData = [];

        // Set margins and dimensions based on the parent element's size
        vis.margin = { top: 10, right: 50, bottom: 10, left: 50 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // Define region labels and their positions
        vis.regionCenters = {
            "SA": { x: -450, y: 200 },
            "ECA": { x: -300, y: 200 },
            "MENA": { x: -150, y: 200 },
            "SSA": { x: 150, y: 200 },
            "LAC": { x: 500, y: 200 },
            "EAP": { x: 700, y: 200 },
            "NA": { x: 1000, y: 200 }
        };

        // Define development centers labels and their positions
        vis.devCenters = {
            "Least Developed": { x: -300, y: 200 },
            "Less Developed": { x: 100, y: 200 },
            "More Developed": { x: 400, y: 200 },
            "Not Classified": { x: 800, y: 200 }
        };

        // Map region codes to full names
        vis.regionFullNameMap = {
            "SA": "South Asia",
            "ECA": "Europe and Central Asia",
            "MENA": "Middle East and North Africa",
            "SSA": "Sub-Saharan Africa",
            "LAC": "Latin America and the Caribbean",
            "EAP": "East Asia and the Pacific",
            "NA": "North America"
        };

        // Create SVG element
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${vis.width + vis.margin.left + vis.margin.right} ${vis.height + vis.margin.top + vis.margin.bottom}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Create text elements for development statuses
        vis.LessDeveloped = vis.svg.append("text").attr("class", "dev-status-text");
        vis.LeastDeveloped = vis.svg.append("text").attr("class", "dev-status-text");
        vis.MoreDeveloped = vis.svg.append("text").attr("class", "dev-status-text");

        // Create a tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'bubbleTooltip');

        // Load and visualize the data
        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        // Iterate through the data (countries) and create a formatted object for each entry
        vis.data.forEach(function (d, index) {
            // Create a country object with relevant attributes
            let country = {
                "id": d["Countries and areas"],
                "value": d["Total"],
                "region": d["Region"],
                "female": d["Female"],
                "male": d["Male"],
                "rural": d["Rural_Residence"],
                "urban": d["Urban_Residence"],
                "devStatus": d["Development Regions"]
            };

            // Push the formatted country object to the display data array
            vis.displayData.push(country);
        });

        // Update the visualization using the processed data
        vis.updateVis();
    }


    updateVis() {
        let vis = this;

        // Clear existing SVG elements
        vis.svg.selectAll("*").remove();

        // Define color scale for regions
        const color = d3.scaleOrdinal(d3.schemeTableau10);
        const group = d => (d.region);

        // Create simulation with velocity decay
        vis.simulation = d3.forceSimulation()
            .velocityDecay(0.2);

        // Create pack layout
        vis.pack = d3.pack()
            .size([vis.width, vis.height])
            .padding(3);

        // Create hierarchy and pack nodes
        vis.root = vis.pack(d3.hierarchy({ children: vis.displayData }).sum(d => d.value));

        // Selectively display country names for larger circles
        const thresholdRadius = 100;

        // Create simulation nodes and center force
        vis.simulation.nodes(vis.root.leaves())
            .force('center', d3.forceCenter(vis.width / 2, vis.height / 2))
            .force('collision', d3.forceCollide().radius(d => d.r + 2)); // Adjust the '2' for separation

        // Create SVG groups for nodes
        vis.node = vis.svg.append("g")
            .selectAll()
            .data(vis.root.leaves())
            .join("g")
            .attr("transform", d => `translate(${d.x},${d.y})`);

        // Append circles to nodes
        vis.node.append("circle")
            .attr("fill-opacity", 0.7)
            .attr("fill", d => color(group(d.data)))
            .attr("r", d => d.r)
            .on('mouseover', function (event, d) {
                // Handle mouseover event
                d3.select(this)
                    .attr("fill", d3.schemeTableau10[8]);

                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                    <div style="border: thin solid grey; border-radius: 5px; background: white; padding: 10px">
                        <h3 style="font-weight: bold">${d.data.id}</h3>
                        <h4>Out of School Rate: ${d.value}%</h4> 
                        <h4>Female: ${d.data.female}%</h4> 
                        <h4>Male: ${d.data.male}%</h4> 
                        <h4>Rural: ${d.data.rural}%</h4> 
                        <h4>Urban: ${d.data.urban}%</h4> 
                    </div>`);
            })
            .on('mouseout', function (event, d) {
                // Handle mouseout event
                d3.select(this)
                    .attr('fill', d => color(group(d.data)));

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            });

        // Display names only for circles larger than the threshold radius
        vis.node.filter(d => d.r > thresholdRadius)
            .append("text")
            .selectAll("tspan")
            .data(d => d.data.id.split(/(?=[A-Z][^A-Z])/g))
            .join("tspan")
            .attr("x", 0)
            .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
            .text(d => d)
            .attr("fill", "black")
            .attr("text-anchor", "middle")
            .style("font-size", "11px");

        // Create legend
        vis.regions = [...new Set(vis.displayData.map(d => d.region))];
        const filteredRegions = vis.regions.filter(region => region !== "NA");
        const legendY = -10;
        const legendXValues = [100, 240, 450, 690, 880, 1150];

        const legend = vis.svg.selectAll(".legend")
            .data(filteredRegions)
            .enter()
            .append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => `translate(${legendXValues[i]},${legendY})`); // Use the specified x-coordinate

        // Append legend circles
        legend.append("circle")
            .attr("r", 9)
            .attr("fill-opacity", 0.7)
            .attr("transform", "translate(5, 10)")
            .attr("fill", d => color(d));

        // Append legend text
        legend.append("text")
            .attr("x", 25) // Adjust the x-coordinate to create space between color and text
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "start") // Align text to the start of the rect
            .text(d => vis.regionFullNameMap[d]);

        // Append legend circles and text for small and large out-of-school rates
        vis.svg.append("circle")
            .attr("cx", vis.width / 1.2 - 50)
            .attr("cy", 90)
            .attr("r", 9)
            .attr("stroke", "black")
            .attr("fill", "white");

        vis.svg.append("text")
            .attr("x", vis.width / 1.2)
            .attr("y", 95)
            .text("Small out of school rate");

        vis.svg.append("circle")
            .attr("cx", vis.width / 1.2 - 50)
            .attr("cy", 130)
            .attr("r", 18)
            .attr("stroke", "black")
            .attr("fill", "white");

        vis.svg.append("text")
            .attr("x", vis.width / 1.2)
            .attr("y", 135)
            .text("Large out of school rate");

        // Configure simulation forces
        var center = { x: vis.width / 2, y: vis.height / 2 };
        vis.forceStrength = 0.03;

        // Configure simulation forces
        vis.simulation
            .force('x', d3.forceX().strength(vis.forceStrength).x(center.x))
            .force('y', d3.forceY().strength(vis.forceStrength).y(center.y))
            .force('charge', d3.forceManyBody().strength(charge))
            .force('collide', d3.forceCollide().radius(d => d.r + 2))
            .on('tick', ticked);

        // Start the simulation
        vis.simulation.restart();

        // Event listeners for different visualization modes
        d3.select("#allCountries").on("click", function () {
            vis.updateVis();
        });

        d3.select("#countriesByRegion").on("click", function () {
            vis.moveBubblesByRegion();
        });

        d3.select("#countriesByDevStatus").on("click", function () {
            vis.moveBubblesByDevStatus();
        });

        d3.select("#countriesByGender").on("click", function () {
            vis.moveBubblesByGender();
        });

        d3.select("#countriesByUrban").on("click", function () {
            vis.moveBubblesByUrban();
        });

        // Helper function for charge force
        function charge(d) {
            return -vis.forceStrength * Math.pow(d.radius, 2.0);
        }

        // Helper function for ticked event
        function ticked() {
            vis.node.attr('transform', d => `translate(${d.x},${d.y})`);
        }
    }

    moveBubblesByRegion() {
        let vis = this;

        // Remove existing status text and center lines
        vis.svg.selectAll(".status-text").remove();
        vis.svg.selectAll(".center-line").remove();

        // Adjust the force strength for the simulation
        vis.forceStrength = 0.08;

        // Define a function to set the x-position based on the region for each node
        function nodeRegionPos(d) {
            return vis.regionCenters[d.data.region].x;
        }

        // Apply the new force to position nodes by region
        vis.simulation.force('x', d3.forceX().strength(vis.forceStrength).x(nodeRegionPos));

        // Restart the simulation with a higher alpha to kick-start the movement
        vis.simulation.alpha(1).restart();
    }

    moveBubblesByDevStatus() {
        let vis = this;

        // Remove existing status text and center lines
        vis.svg.selectAll(".status-text").remove();
        vis.svg.selectAll(".center-line").remove();

        // Adjust the force strength for the simulation
        vis.forceStrength = 0.08;

        // Define a function to set the x-position based on the development status for each node
        function nodeDevStatusPos(d) {
            return vis.devCenters[d.data.devStatus].x;
        }

        // Apply the new force to position nodes by development status
        vis.simulation.force('x', d3.forceX().strength(vis.forceStrength).x(nodeDevStatusPos));

        // Restart the simulation with a higher alpha to kick-start the movement
        vis.simulation.alpha(1).restart();

        // Append status text for visualization
        vis.LessDeveloped = vis.svg.append("text")
            .attr("class", "status-text")
            .attr("x", (vis.width / 2))
            .attr("y", vis.height)
            .style("text-anchor", "middle")
            .style("font-size", "22px")
            .text("Less Developed");

        vis.LeastDeveloped = vis.svg.append("text")
            .attr("class", "status-text")
            .attr("x", vis.width / 1.45)
            .attr("y", vis.height)
            .style("text-anchor", "middle")
            .style("font-size", "22px")
            .text("More Developed");

        vis.MoreDeveloped = vis.svg.append("text")
            .attr("class", "status-text")
            .attr("x", vis.width / 3.8)
            .attr("y", vis.height)
            .style("text-anchor", "middle")
            .style("font-size", "22px")
            .text("Least Developed");
    }

    moveBubblesByGender() {
        let vis = this; // Ensure access to the class instance

        // Remove existing status text and center lines
        vis.svg.selectAll(".status-text").remove();
        vis.svg.selectAll(".center-line").remove();

        // Adjust the force strength for the simulation
        vis.forceStrength = 0.08;

        // Function to get the x position based on the female variable
        function nodeFemalePos(d) {
            // You may need to adjust the scaling factor based on your data
            // The factor 20 is arbitrary and can be adjusted based on the data range
            return vis.width / 2 - (d.data.female - d.data.male) * 20;
        }

        // Append a center line to visualize the separation
        vis.svg.append("line")
            .attr("class", "center-line")
            .attr("x1", vis.width / 2)
            .attr("y1", 0)
            .attr("x2", vis.width / 2)
            .attr("y2", vis.height)
            .style("stroke", "black")
            .style("stroke-dasharray", "5,5"); // Make it a dotted line

        // Apply the new force to position nodes by gender
        vis.simulation.force('x', d3.forceX().strength(vis.forceStrength).x(nodeFemalePos));

        // Restart the simulation with a higher alpha to kick-start the movement
        vis.simulation.alpha(1).restart();

        // Append status text for visualization
        vis.HigherFemale = vis.svg.append("text")
            .attr("class", "status-text")
            .attr("x", 350)
            .attr("y", vis.height)
            .style("text-anchor", "middle")
            .style("font-size", "22px")
            .text("Higher Female Out of School Rate");

        vis.HigherMale = vis.svg.append("text")
            .attr("class", "status-text")
            .attr("x", 1050)
            .attr("y", vis.height)
            .style("text-anchor", "middle")
            .style("font-size", "22px")
            .text("Higher Male Out of School Rate");
    }

    moveBubblesByUrban() {
        let vis = this; // Ensure access to the class instance

        // Remove existing status text and center lines
        vis.svg.selectAll(".status-text").remove();
        vis.svg.selectAll(".center-line").remove();

        // Adjust the force strength for the simulation
        vis.forceStrength = 0.08;

        // Function to get the x position based on the urban variable
        function nodeUrbanPos(d) {
            // You may need to adjust the scaling factor based on your data
            // The factor 14 is arbitrary and can be adjusted based on the data range
            return vis.width / 2 - (d.data.rural - d.data.urban) * 14;
        }

        // Append a center line to visualize the separation
        vis.svg.append("line")
            .attr("class", "center-line")
            .attr("x1", vis.width / 1.8)
            .attr("y1", 0)
            .attr("x2", vis.width / 1.8)
            .attr("y2", vis.height)
            .style("stroke", "black")
            .style("stroke-dasharray", "5,5"); // Make it a dotted line

        // Apply the new force to position nodes by urban status
        vis.simulation.force('x', d3.forceX().strength(vis.forceStrength).x(nodeUrbanPos));

        // Restart the simulation with a higher alpha to kick-start the movement
        vis.simulation.alpha(1).restart();

        // Append status text for visualization
        vis.HigherRural = vis.svg.append("text")
            .attr("class", "status-text")
            .attr("x", 350)
            .attr("y", vis.height)
            .style("text-anchor", "middle")
            .style("font-size", "22px")
            .text("Higher Rural Out of School Rate");

        vis.HigherUrban = vis.svg.append("text")
            .attr("class", "status-text")
            .attr("x", 1050)
            .attr("y", vis.height)
            .style("text-anchor", "middle")
            .style("font-size", "22px")
            .text("Higher Urban Out of School Rate");
    }

}