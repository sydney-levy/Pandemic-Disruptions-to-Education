class LinePlotCovid {
    constructor(parentElement, covidData, _eventHandler) {
        // Initialize class properties
        this.parentElement = parentElement;
        this.covidData = covidData;
        this.displayData = [];
        this.parseDate = d3.timeParse("%Y-%m-%d");
        this.eventHandler = _eventHandler;

        // Initialize the visualization
        this.initVis();
    }

    initVis() {
        let vis = this;

        // Set up the margin, width, and height of the visualization
        vis.margin = { top: 40, right: 0, bottom: 60, left: 60 };
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

        // Parse dates in the COVID data
        vis.covidData.forEach(d => {
            d.Date = vis.parseDate(d.Date);
        });

        // Set up scales and axes
        vis.x = d3.scaleTime().range([0, vis.width]);
        vis.y = d3.scaleLinear().range([vis.height, 0]);
        vis.xAxis = d3.axisBottom().scale(vis.x).tickFormat(d3.timeFormat("%b %Y"));
        vis.yAxis = d3.axisLeft().scale(vis.y).ticks(6);

        // Set domains
        let minMaxY = [0, d3.max(vis.covidData, d => d.Fully_Open)];
        let minMaxX = d3.extent(vis.covidData, d => d.Date);
        vis.y.domain(minMaxY);
        vis.x.domain(minMaxX);

        // Append axis elements
        vis.svg.append("g").attr("class", "x-axis axis").attr("transform", "translate(0," + vis.height + ")");
        vis.svg.append("g").attr("class", "y-axis axis");

        // Axis title
        vis.svg.append("text")
            .attr("class", "axis-label")
            .attr("x", -10)
            .attr("y", -20)
            .text("Number of Countries");

        // Initialize brush and zoom components
        vis.currentBrushRegion = null;
        vis.brush = d3.brushX()
            .extent([[0, 0], [vis.width, vis.height]])
            .on("brush", function (event) {
                vis.currentBrushRegion = event.selection;
                vis.currentBrushRegion = vis.currentBrushRegion.map(vis.x.invert);
                vis.eventHandler.trigger("selectionChanged", vis.currentBrushRegion);
            });

        // Append brush component
        vis.brushGroup = vis.svg.append("g").attr("class", "brush").call(vis.brush);

        // Display time period information
        const fullRange = vis.x.domain();
        const startTime = fullRange[0];
        const endTime = fullRange[1];
        d3.select("#time-period-min").text(dateFormatter(startTime));
        d3.select("#time-period-max").text(dateFormatter(endTime));

        // Save the original x scale for zooming
        vis.xOrig = vis.x;

        // Information about different lines in the chart
        vis.lineInfo = [
            { id: "openline", color: d3.schemeTableau10[4], label: "Fully Open", key: "Fully_Open" },
            { id: "academic-break", color: d3.schemeTableau10[9], label: "Academic Break", key: "Academic_Break" },
            { id: "partially-open", color: d3.schemeTableau10[1], label: "Partially Open", key: "Partially_Open" },
            { id: "closed", color: d3.schemeTableau10[2], label: "Closed", key: "Closed" },
        ];

        // Create legend group and position it
        vis.legend = vis.svg.append("g").attr("class", "legend").attr("transform", `translate(${vis.width - 300}, 0)`);

        // Add rectangles to the legend for each line
        vis.legend.selectAll("rect")
            .data(vis.lineInfo)
            .enter().append("rect")
            .attr("width", 10).attr("height", 10)
            .attr("x", 0).attr("y", (d, i) => i * 20)
            .attr("fill", d => d.color)
            .attr("font", "arial");

        // Add text labels to the legend
        vis.legend.selectAll("text")
            .data(vis.lineInfo)
            .enter().append("text")
            .attr("x", 15).attr("y", (d, i) => i * 20 + 10)
            .text(d => d.label).attr("class", "legend-text");

        // Zoom function for updating scales and line generators
        vis.zoomFunction = function (event) {
            let xScaleModified = event.transform.rescaleX(vis.xOrig);
            vis.x = xScaleModified;
            vis.svg.select(".x-axis").call(vis.xAxis.scale(vis.x));

            // Update line generators with the new x-scale
            vis.lineInfo.forEach(line => {
                vis[line.key] = d3.line()
                    .x(d => vis.x(d.Date))
                    .y(d => vis.y(d[line.key]))
                    .curve(d3.curveLinear);
            });

            if (vis.currentBrushRegion) {
                vis.brushGroup.call(vis.brush.move, vis.currentBrushRegion.map(vis.x));
            }

            // Redraw the lines
            vis.updateVis();
        };

        // Create a zoom behavior
        vis.zoom = d3.zoom()
            .on("zoom", vis.zoomFunction)
            .scaleExtent([1, 20])
            .translateExtent([[0, 0], [vis.width, vis.height]]); // Disable panning

        // Add an invisible overlay rectangle for zooming
        vis.zoomOverlay = vis.svg.append("rect")
            .attr("class", "zoom-overlay")
            .attr("fill", "transparent")
            .attr("transform", `translate(${vis.margin.left},${vis.margin.top})`)
            .call(vis.zoom);

        // Create a group for zoom-related elements
        vis.zoomGroup = vis.svg.append("g")
            .attr("class", "zoom");

        // Wrangle, filter, aggregate, or modify data
        vis.wrangleData();

    }

    wrangleData() {
        let vis = this;

        // Update the visualization
        vis.updateVis();
    }

    // Initialize and draw the chart
    initializeAndDrawChart() {
        this.createLinesWithTransition();
    }

    // Update the visualization
    updateVis() {
        let vis = this;

        // Call brush component
        vis.brushGroup.call(vis.brush);

        // Disable mousedown and touchstart in zoom when activated
        vis.brushGroup.call(vis.zoom)
            .on("mousedown.zoom", null)
            .on("touchstart.zoom", null);

        // Update axes
        vis.svg.select(".x-axis").call(vis.xAxis);
        vis.svg.select(".y-axis").call(vis.yAxis);

        // Update lines with new scales
        vis.lineInfo.forEach(line => {
            vis.svg.select(`#${line.id}`)
                .attr("d", vis[line.key]);
        });
    }

    // Handle selection change event
    onSelectionChange(rangeStart, rangeEnd) {
        let vis = this;

        // Update the time period labels
        d3.select("#time-period-min").text(dateFormatter(rangeStart));
        d3.select("#time-period-max").text(dateFormatter(rangeEnd));
    }

    // Create lines with transition
    createLinesWithTransition() {
        let vis = this;

        // Remove existing lines
        vis.svg.selectAll(".line").remove();

        vis.lineInfo.forEach(line => {
            // Define line generator
            vis[line.key] = d3.line()
                .x(d => vis.x(d.Date))
                .y(d => vis.y(d[line.key]))
                .curve(d3.curveLinear);

            // Append path for the line with transition
            vis.svg.append("g")
                .attr("clip-path", "url(#clip)")
                .append("path")
                .data([vis.covidData])
                .attr("class", "line")
                .attr("id", line.id)
                .style("fill", "none")
                .style("stroke", line.color)
                .style("stroke-width", 2)
                .attr("d", vis[line.key])
                .on("mouseover", function (event, d) {
                    // Highlight the hovered line and fade others
                    d3.select(this)
                        .style("stroke", line.color)
                        .raise(); // Move the line to the front

                    vis.lineInfo.forEach(otherLine => {
                        if (otherLine.id !== line.id) {
                            vis.svg.select(`#${otherLine.id}`)
                                .style("stroke", "lightgrey");
                        }
                    });
                })
                .on("mouseout", function () {
                    // Reset the stroke of all lines to their original colors
                    vis.lineInfo.forEach(otherLine => {
                        vis.svg.select(`#${otherLine.id}`)
                            .style("stroke", otherLine.color);
                    });
                })
                .call(path => path.transition()
                    .duration(8000) // Adjust the duration as needed
                    .ease(d3.easeLinear)
                    .attrTween("stroke-dasharray", function () {
                        const length = this.getTotalLength();
                        return d3.interpolate(`0,${length}`, `${length},${length}`);
                    })
                );
        });
    }


}