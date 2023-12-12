class MapVis {
    constructor(parentElement, oosData, geoData) {
        this.parentElement = parentElement;
        this.oosData = oosData;
        this.geoData = geoData;

        // Parse time and numeric values in the data
        const parseTime = d3.timeParse("%Y");
        this.oosData.forEach(d => {
            d.year = parseTime(d.year);
            d.value = Number(d.value);
            d.upper = Number(d.upper);
            d.lower = Number(d.lower);
        });

        // Initialize the visualization
        this.initVis();
    }

    initVis() {
        let vis = this;

        // Set up margin, width, and height
        vis.margin = { top: 10, right: 20, bottom: 10, left: 20 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // Create SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("viewBox", `0 0 ${vis.width + vis.margin.left + vis.margin.right} ${vis.height + vis.margin.top + vis.margin.bottom}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .append('g')
            .attr('transform', `translate(${vis.margin.left}, ${vis.margin.top})`);

        // Set up line chart container
        vis.lineChart = vis.svg.append("g")
            .attr("class", "line-chart-container")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr("transform", `translate(${vis.width * 0.6}, ${vis.margin.top + 50})`);

        // Add line chart title
        vis.lineChart.append('text')
            .attr('class', 'chart-title')
            .attr('text-anchor', 'middle')
            .attr('x', vis.width / 6)
            .attr('y', -5);

        // Initialize axes
        vis.lineChart.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${vis.height})`);

        vis.lineChart.append("g")
            .attr("class", "y-axis");

        // Create tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'mapTooltip');

        // Oval projection of the globe
        vis.projection = d3.geoBromley()
            .translate([vis.width / 4 - vis.margin.left , vis.height / 2.3])
            .scale(105);

        vis.path = d3.geoPath().projection(vis.projection);

        // Load world features from geoData
        vis.world = topojson.feature(vis.geoData, vis.geoData.objects.countries).features;

        // Add title for the legend
        vis.svg.append('text')
            .attr('class', 'legend-title')
            .attr('text-anchor', 'middle')
            .attr('stroke', 'black')
            .attr('x', vis.width/2.3)
            .attr('y',  vis.height/1.4)
            .text('Average Out of School Rate');

        // Add sphere to represent the globe
        vis.svg.append("path")
            .datum({type: "Sphere"})
            .attr("class", "sphere")
            .attr('fill', '#76b7b2')
            .attr("fill-opacity", 0.7)
            .attr("stroke","rgba(129,129,129,0.35)")
            .attr("d", vis.path);

        // Initialize the visualization data
        vis.wrangleData();
        vis.updateLineChart('Global Average');
    }

    wrangleData() {
        let vis = this;

        // Merge datasets to get out-of-school rates for each country
        vis.mergedData = vis.world.map(geometry => {
            vis.countryName = geometry.properties.name;
            vis.countryData = vis.oosData.find(d => d.name === vis.countryName);

            // Add out-of-school rate data to the geometry
            if (vis.countryData) {
                geometry.properties.outOfSchoolRate = vis.countryData.value;
            }

            return geometry;
        });

        // Group oosData by year
        vis.groupedData = d3.group(vis.oosData, d => d.year);

        // Calculate average data for each year
        vis.averageData = [];
        vis.groupedData.forEach((values, key) => {
            const meanValue = d3.mean(values, d => d.value);
            const meanUpper = d3.mean(values, d => d.upper);
            const meanLower = d3.mean(values, d => d.lower);

            // Append into dictionary needed elements for the tooltip
            vis.averageData.push({
                year: key,
                value: meanValue,
                upper: meanUpper,
                lower: meanLower
            });
        });

        // Update the visualization
        vis.updateVis();
    }


    updateVis() {
        let vis = this;

        // Extract out-of-school rates
        const outOfSchoolRates = vis.mergedData.map(d => d.properties.outOfSchoolRate);

        // Find the minimum and maximum out-of-school rates
        vis.minOutOfSchoolRate = d3.min(outOfSchoolRates);
        vis.maxOutOfSchoolRate = d3.max(outOfSchoolRates);

        // Define color scale
        const colorScale = d3.scaleLinear()
            .domain([vis.minOutOfSchoolRate, vis.maxOutOfSchoolRate])
            .range(['#fffed1', '#e15759']);

        // Select all country paths and bind data
        vis.countries = vis.svg.selectAll('.country')
            .data(vis.mergedData);

        // Apply color for different countries
        vis.countries
            .enter().append('path')
            .attr('class', 'country')
            .attr('fill', d => {
                // Check if outOfSchoolRate is defined
                if (d.properties.outOfSchoolRate !== undefined) {
                    // Use the out-of-school rate for coloring
                    const outOfSchoolRate = d.properties.outOfSchoolRate;
                    return colorScale(outOfSchoolRate);
                } else {
                    return 'whitesmoke';
                }
            })
            .attr("stroke", "rgba(129,129,129,0.35)")
            .attr("d", vis.path)
            .on('click', function(event, d){
                vis.updateLineChart(d.properties.name);
            })
            .on('mouseover', function(event, d){
                d3.select(this)
                    .attr('stroke-width', 1)
                    .attr('fill', 'darkred');
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                        <div style="border: thin solid grey; border-radius: 5px; background: white; padding: 10px">
                            <h3 style="font-weight: bold; color:darkred">${d.properties.name}</h3>  
                            <h5> Country: ${d.properties.name} </h5>  
                            <h5> Out-of-School Rate(AVG): ${d.properties.outOfSchoolRate !== undefined ? d.properties.outOfSchoolRate : 'No Data Available'} </h5>            
                        </div>`);
            })
            .on('mouseout', function(event, d){
                d3.select(this)
                    .attr('stroke', 'transparent')
                    .attr('fill', d => {
                        // Check if outOfSchoolRate is defined
                        if (d.properties.outOfSchoolRate !== undefined) {
                            // Use the out-of-school rate for coloring
                            const outOfSchoolRate = d.properties.outOfSchoolRate;
                            return colorScale(outOfSchoolRate);
                        } else {
                            return 'whitesmoke';
                        }
                    });

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html('');
            });

        // Set the position and size of the legend
        const legendWidth = 200;
        const legendHeight = 20;
        const legendX = vis.width/3;
        const legendY = vis.height/1.4;

        // Define legend scale
        const legendScale = d3.scaleLinear()
            .domain([vis.minOutOfSchoolRate, vis.maxOutOfSchoolRate])
            .range([0, legendWidth]);

        // Create the legend axis
        const legendAxis = d3.axisBottom(legendScale)
            .ticks(5)
            .tickSize(4)
            .tickFormat(d3.format(".1f"));

        // Append the axis to the SVG
        vis.svg.append("g")
            .attr("class", "legend-axis")
            .attr("transform", `translate(${legendX+50}, ${legendY +40})`)
            .call(legendAxis);

        // Create the color legend gradient
        vis.svg.append("linearGradient")
            .attr("id", "legend-gradient")
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", legendX)
            .attr("y1", legendY)
            .attr("x2", legendX + legendWidth)
            .attr("y2", legendY)
            .selectAll("stop")
            .data([
                { offset: "0%", color: "#fffed1" },
                { offset: "100%", color: '#e15759'}
            ])
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);

        // Create the color legend rectangle
        vis.svg.append("rect")
            .attr("x", legendX+50)
            .attr("y", legendY+20)
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#legend-gradient)");
    }


    updateLineChart(Country) {
        let vis = this;

        // Create x and y scales for the line chart
        const xScale = d3.scaleTime().range([0, vis.width / 3]);
        const yScale = d3.scaleLinear().range([vis.height - 200, 0]);

        // Define the line function
        const line = d3.line()
            .x(function(d) { return xScale(d.year); })
            .y(function(d) { return yScale(d.value); })
            .curve(d3.curveLinear);

        // Update filteredData based on the selected Country
        if (Country === 'Global Average') {
            vis.filteredData = vis.averageData;
        } else {
            vis.filteredData = vis.oosData.filter(function(d) {
                return d.name === Country;
            });
        }

        // Remove existing line chart components
        vis.lineChart.selectAll(".line-path, .area-path, .x-axis, .y-axis, .y-axis-label, .chart-title").remove();

        // Create new line and area paths
        const linePath = vis.lineChart.append("path")
            .attr("class", "line-path line");

        const areaPath = vis.lineChart.append("path")
            .attr("class", "area-path area");

        // Check if filteredData is not empty before proceeding
        if (vis.filteredData.length > 0) {
            // Set x and y domains based on filtered data
            xScale.domain(d3.extent(vis.filteredData, function(d) {
                return d.year;
            }));
            yScale.domain([0, d3.max(vis.filteredData, function(d) {
                return d.upper;
            })]);

            // Draw the area
            const area = d3.area()
                .x(function(d) { return xScale(d.year); })
                .y0(function(d) { return yScale(d.lower); })
                .y1(function(d) { return yScale(d.upper); });

            areaPath
                .datum(vis.filteredData)
                .attr('fill', 'lightgrey')
                .attr("fill-opacity", 0.7)
                .attr("stroke", "none")
                .attr("fill-opacity", 0.5)
                .attr("d", area);

            // Draw the line
            linePath
                .datum(vis.filteredData)
                .attr("d", line)
                .attr("fill", "none")
                .attr("stroke", "black")
                .attr("stroke-width", 2);

            // Add the title
            vis.lineChart.append('text')
                .attr('class', 'chart-title')
                .attr('text-anchor', 'middle')
                .attr('x', vis.width / 6)
                .attr('y', -15)
                .text(`${Country}`);

            // Update axes
            vis.lineChart.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0, ${vis.height - 200})`)
                .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%Y")));

            vis.lineChart.append("g")
                .attr("class", "y-axis")
                .call(d3.axisLeft(yScale));

            // Add y-axis label
            vis.lineChart.append("text")
                .attr("class", "y-axis-label")
                .attr("text-anchor", "middle")
                .attr("transform", "rotate(-90)")
                .attr("x", -vis.height / 3)
                .attr("y", -45)
                .text("Out of School Rates");
        }
    }

}