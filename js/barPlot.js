// Define a class named BarVis
class BarVis {

    // Constructor for BarVis class
    constructor(parentElement, primaryDemoData) {
        // Initialize properties
        this.parentElement = parentElement;
        this.data = primaryDemoData;

        // Call the initialization method
        this.initVis();
    }

    // Initialize the visualization
    initVis() {
        let vis = this;

        // Set margins and dimensions
        vis.margin = { top: 50, right: 50, bottom: 50, left: 50 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // Create an SVG container
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${vis.width + vis.margin.left + vis.margin.right} ${vis.height + vis.margin.top + vis.margin.bottom}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .append('g')
            .attr('transform', `translate (${vis.width / 4}, ${vis.margin.top})`);

        // Create scales and axes
        vis.xScale = d3.scaleBand()
            .range([0, vis.width])
            .padding(0.1);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.colorScale = d3.scaleOrdinal()
            .range([d3.schemeTableau10[2], d3.schemeTableau10[3]]);

        vis.xAxis = d3.axisBottom(vis.xScale);

        vis.yAxis = d3.axisLeft(vis.yScale);

        // Create axis groups
        vis.xAxisgroup = vis.svg.append("g")
            .attr("class", "x-axis");

        vis.yAxisgroup = vis.svg.append("g")
            .attr("class", "y-axis");

        // Map of region codes to full names
        vis.regionFullNameMap = {
            "SA": "South Asia",
            "ECA": "Europe",
            "MENA": "Middle East",
            "SSA": "Sub-Saharan Africa",
            "LAC": "Latin America",
            "EAP": "East Asia",
            "NA": "North America"
        };

        // Call the data wrangling method
        this.wrangleData();
    }

    // Data wrangling method
    wrangleData() {
        let vis = this;

        // Call the update method to render the visualization
        vis.updateVis();
    }

    // Update the visualization based on the data
    updateVis() {
        let vis = this;

        // Define variables for category attributes and initialize metric set
        let categoryAttribute1, categoryAttribute2;
        let metricSet = new Set();

        // Check the selected category to determine attributes and metrics
        if (selectedCategory === "Gender") {
            metricSet = new Set(["Female", "Male"]);
            categoryAttribute1 = "Female";
            categoryAttribute2 = "Male";
            vis.maxMetric = d3.max(vis.data, d => Math.max(d.Male, d.Female));
        } else if (selectedCategory === "Residency") {
            metricSet = new Set(["Urban", "Rural"]);
            categoryAttribute1 = "Urban";
            categoryAttribute2 = "Rural";
            vis.maxMetric = d3.max(vis.data, d => Math.max(d.Rural, d.Urban));
        }

        // Update color scale and y-scale domain based on the metric set and maxMetric
        vis.colorScale.domain(Array.from(metricSet));
        vis.yScale.domain([0, vis.maxMetric]);

        // Update x-scale domain based on data regions
        vis.xScale.domain(vis.data.map(d => d.Region)).range([0, vis.width / 2]);

        // Define x-coordinates for legend items
        const legendXValues = [10, 110];

        // Create legend groups with rectangles and text
        const legend = vis.svg.selectAll(".legend")
            .data(metricSet)
            .enter()
            .append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => `translate(${legendXValues[i]},0)`);

        legend.append("rect")
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill-opacity", 0.7)
            .attr("fill", d => vis.colorScale(d));

        legend.append("text")
            .attr("x", 25)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .text(d => d);

        // Update legend text based on the metric set for the selected category
        vis.svg.selectAll(".legend text").data(metricSet).text(d => d);

        // Calculate bar width
        let barWidth = vis.xScale.bandwidth() / 2;

        // Update and enter left bars
        vis.leftBars = vis.svg.selectAll('.bar-left').data(vis.data);
        vis.leftBars.transition()
            .duration(500)
            .attr('x', d => vis.xScale(d.Region) - 2 * barWidth)
            .attr('y', d => vis.yScale(d[categoryAttribute1]))
            .attr('width', barWidth)
            .attr('height', d => vis.height - vis.yScale(d[categoryAttribute1]));

        vis.leftBars.exit().remove();

        vis.leftBars.enter()
            .append('rect')
            .attr('class', `bar-left`)
            .attr('x', d => vis.xScale(d.Region) - 2 * barWidth)
            .attr('y', d => vis.yScale(d[categoryAttribute1]))
            .attr('width', barWidth)
            .attr('height', d => vis.height - vis.yScale(d[categoryAttribute1]))
            .attr("fill", d => vis.colorScale(categoryAttribute1))
            .attr('fill-opacity', 0.7);

        // Update and enter right bars
        vis.rightBars = vis.svg.selectAll('.bar-right').data(vis.data);
        vis.rightBars.transition()
            .duration(500)
            .attr('x', d => vis.xScale(d.Region) - 3 * barWidth)
            .attr('y', d => vis.yScale(d[categoryAttribute2]))
            .attr('width', barWidth)
            .attr('height', d => vis.height - vis.yScale(d[categoryAttribute2]));

        vis.rightBars.exit().remove();

        vis.rightBars.enter()
            .append('rect')
            .attr('class', `bar-right`)
            .attr('x', d => vis.xScale(d.Region) - 3 * barWidth)
            .attr('y', d => vis.yScale(d[categoryAttribute2]))
            .attr('width', barWidth)
            .attr('height', d => vis.height - vis.yScale(d[categoryAttribute2]))
            .attr("fill", d => vis.colorScale(categoryAttribute2))
            .attr('fill-opacity', 0.7);

        // Update x-axis labels
        vis.xAxisgroup.selectAll(".x-axis-label")
            .data(vis.data)
            .enter()
            .append("text")
            .attr("class", "x-axis-label")
            .attr("x", d => vis.xScale(d.Region) - barWidth * 2)
            .attr("y", vis.height + 30)
            .attr("font-size", "13px")
            .style("text-anchor", "middle")
            .text(d => vis.regionFullNameMap[d.Region]);
    }

}

const facts = [
    "Early marriage and child labor contribute to high out-of-school rates, especially among girls.",
    "Mongolia utilizes mobile classrooms to reach nomadic communities.",
    "In developing nations flooding can disrupt transportation to schools, exacerbating out-of-school challenges.",
    "The countries in which the share of children who are not in school is low – lower than 5% – all have a GDP per capita above $35,000.",
    "Free meals in schools is proven as the best policy yet, it gives incentives to parents to send their children to school .",
    "Half of all out-of-school children live in conflict-affected countries.",
    "In some areas, traditional gender roles limit educational opportunities for girls, perpetuating gender disparities.",
    "Of the world’s 787 million children of primary school age, 8% do not go to school ",
    "Twenty years ago 16% of children were out of school."
]


// Initialize variables for tracking fact and character indices, and click count
let currentFactIndex = 0;
let currentCharacterIndex = 0;
let clickCount = 0;

// Function to immediately set the text content without typing effect
function typeFact() {
    const factTextElement = document.getElementById("factText");
    const currentFact = facts[currentFactIndex];

    // Set the text content immediately without typing effect
    factTextElement.textContent = currentFact;
}

// Function to clear displayed facts
function clearFacts() {
    // Clear existing paragraphs with the class "generated-content"
    const factGeneratorElement = document.getElementById("factGenerator");
    const paragraphs = factGeneratorElement.getElementsByClassName("generated-content");

    // Remove each paragraph
    while (paragraphs.length > 0) {
        paragraphs[0].remove();
    }
}

// Function to display the next fact with a typing effect
function nextFact() {
    const factTextElement = document.getElementById("factText");
    const currentFact = facts[currentFactIndex];

    // Create a new paragraph element
    let paragraph = document.createElement("p");
    paragraph.className = "generated-content";

    // Create paragraph content
    let node = document.createTextNode(currentFact);

    // Add paragraph content to the tag
    paragraph.appendChild(node);

    // Add paragraph to the div container with ID "factGenerator"
    let element = document.getElementById("factGenerator");
    element.appendChild(paragraph);

    // Move to the next fact after a delay
    currentCharacterIndex = 0;
    currentFactIndex = (currentFactIndex + 1) % facts.length;
    clickCount++;

    // Check if the number of displayed facts is 5, then clear and start again
    if (clickCount > 5) {
        clickCount = 0;
        clearFacts();
    }
}
