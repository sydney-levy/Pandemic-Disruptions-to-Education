class areaChart {

    constructor(parentElement, data, columnToPlot, eventHandler) {
        // Initialize class properties
        this.parentElement = parentElement;
        this.data = data;
        this.filteredData = this.data;
        this.columnToPlot = columnToPlot;
        this.eventHandler = eventHandler;

        // Initialize the visualization
        this.initVis();
    }

    /*
     * Initialize visualization (static content, e.g., SVG area or axes)
     */
    initVis() {
        let vis = this;

        // Set margins for better layout
        vis.margin = { top: 20, right: 20, bottom: 20, left: 60 };

        // Set width and height based on the parent element's dimensions
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // Create SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement)
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${vis.width + vis.margin.left + vis.margin.right} ${vis.height + vis.margin.top + vis.margin.bottom}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .append("g")
            .attr("transform", `translate(${vis.margin.left},${vis.margin.top})`);

        // Set up scales and axes
        vis.x = d3.scaleTime()
            .range([0, vis.width])
            .domain(d3.extent(vis.data, d => d.Date));

        vis.y = d3.scaleLinear()
            .range([vis.height, 0])
            .domain([0, d3.max(vis.data, d => d[vis.columnToPlot])]);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .ticks(3)
            .tickFormat(d3.timeFormat("%b %Y"));

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);

        // Append a path for the area function
        vis.areaPath = vis.svg.append("path")
            .attr("class", "area")
            .style("fill", vis.columnToPlot === 'Closed' ? d3.schemeTableau10[2] : d3.schemeTableau10[4]); // Set color based on the column

        // Define the D3 path generator
        vis.area = d3.area()
            .x(d => vis.x((d.Date)))
            .y0(vis.height)
            .y1(d => vis.y(d[vis.columnToPlot]));

        vis.area.curve(d3.curveCardinal);

        // Append axes
        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")")
            .call(vis.xAxis);

        vis.svg.append("g")
            .attr("class", "y-axis axis")
            .call(vis.yAxis);

        // Axis titles
        vis.svg.append("text")
            .attr("x", -50)
            .attr("y", -8)
            .text(vis.columnToPlot === 'Closed' ? "Number of Countries with Schools Closed" : "Number of Countries with Schools Fully Open");

        // Filter, aggregate, modify data
        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        // Update the visualization after data wrangling
        vis.updateVis();
    }

    /*
     * The drawing function
     */

    updateVis() {
        let vis = this;

        // Update x and y domains based on filtered data
        vis.x.domain(d3.extent(vis.filteredData, d => d.Date));
        vis.y.domain([0, d3.max(vis.data, d => d[vis.columnToPlot])]);

        // Call the area function and update the path with a smooth transition
        vis.areaPath
            .datum(vis.filteredData)
            .attr("d", vis.area);

        // Update the x and y axes with the new domain
        vis.svg.select(".x-axis").call(vis.xAxis);
        vis.svg.select(".y-axis").call(vis.yAxis);
    }

    // Handle selection change event (e.g., brush interaction)
    onSelectionChange(selectionStart, selectionEnd) {
        let vis = this;

        // Filter data based on the selected time period (brush)
        vis.filteredData = vis.data.filter(function (d) {
            return d.Date >= selectionStart && d.Date <= selectionEnd;
        });

        // Update the visualization with the new filtered data
        vis.wrangleData();
    }
}


