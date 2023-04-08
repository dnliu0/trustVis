
// Will be used to the save the loaded JSON data
var allData = [];

// Date parser to convert strings to date objects
var parseDate = d3.timeParse("%Y");

// Set ordinal color scale
var colorScale = d3.scaleOrdinal();

// Variables for the visualization instances
var areachart, timeline;

var margin = {top: 80, right: 50, bottom: 30, left: 150}

var width, height;

loadData();

// Start application by loading the data


function loadData() {
    d3.csv("data/edited_response.csv").then(function (csvData) {
        allData = csvData;
        allData.forEach(d => {
            d.likertscale = +d.likertscale;
        })
        var select = document.getElementById("grouping-type");
        let value;
        var title = document.createElement("h2");
        let question_type_data = {};
        let unique_questions = Array.from(new Set(allData.map((item) => item.question_type_2)));
        unique_questions.forEach(q => {
            question_type_data[q] = [];
        })
        // store corresponding data to questions
        allData.forEach((d) => {
            unique_questions.forEach(q =>{
                if (d['question_type_2'] === q) {
                    question_type_data[q].push(d);
                }
            })
        })
        select.onchange = function(){
            
            if (this.value === 'question') {
                d3.select("#dataviz").select("." + value).remove();
                value = this.value;
                let unique_scale = Array.from(new Set(allData.map((item) => item.likertscale)));
                let unique_type = Array.from(new Set(allData.map((item) => item.vistype)));
            

                let maxAvg = Math.max(...allData.map(d => d[value]))
                
                // create an array for each unique question
                let question_type_avg = {};
                let question_type_pics = {};
                unique_questions.forEach(q => {
                    question_type_pics[q] = [];
                })
                Object.entries(question_type_data).forEach(([key, values]) => {
                    question_type_avg[key] = countHelper(values, 'image');
                    question_type_pics[key] = Object.entries(question_type_avg[key]).sort((a, b) => b[1] - a[1]).slice(0,5);
                })

                Object.entries(question_type_pics).forEach(([key, values]) => {
                    if(key !== "Attention_Question") {
                        var title = document.createElement("h2");
                        title.innerHTML= key;
                        var sub_title = document.createElement("p");
                        sub_title.innerHTML= values[0].name;
                        document.getElementById("viz").appendChild(title);
                        document.getElementById("viz").appendChild(sub_title);
                        values.forEach(d => {
                            var elem = document.createElement("img");
                            elem.setAttribute("src", "data/" + d[0]);
                            elem.setAttribute("height", "100");
                            elem.setAttribute("alt", "vis");
                            document.getElementById("viz").appendChild(elem);
                        })
                    }
                    
                })
            } else {
                d3.select("#dataviz").select("." + value).remove();
                value = this.value;
                let unique_vals = Array.from(new Set(allData.map((item) => item[value])));
                width = 700 - margin.left - margin.right;
                height = (60 * unique_vals.length) - margin.top - margin.bottom;
                likertToAgree = ['Strongly Disagree', 'Disagree', 'Nor', 'Agree', 'Strongly Agree']
                
                title.innerHTML= value;
                document.getElementById("dataviz").appendChild(title);
               
               
                var currGroup = d3.select("#dataviz").append("g").attr("class", value);
                createVis(allData, value, currGroup, question_type_data, unique_vals);
            }
            
            
        }

        
        
        
        
    }).catch(function(error){
        // handle error   
     });
}

function countHelper(values, term) {
    // let unique_pics = Array.from(new Set(values.map((item) => item.image)));
    let temp_count = {};
    let temp_sum = {};
    
    let avg = values.reduce((pics_avg, value) => {
        temp_count[value[term]] = (temp_count[value[term]] || 0) + 1;
        temp_sum[value[term]] = (temp_sum[value[term]] || 0) + value.likertscale;
        pics_avg[value[term]] = temp_sum[value[term]]/temp_count[value[term]];
        return pics_avg;
    }, {})

    return avg;
}


function sumHelper(values) {
    let count = values.reduce((pics_count, value) => {
        pics_count[value.image] = (pics_count[value.image] || 0) + value.likertscale;
        return pics_count;
    }, {})
}


function createVis(allData, value, currGroup, question_type_data, unique_vals) {
    createHeatMap(allData, value, currGroup, question_type_data, unique_vals);
}

function createHeatMap(allData, value, currGroup, question_type_data, unique_vals) {
    let likertToAgree = ['Strongly Disagree', 'Disagree', 'Nor', 'Agree', 'Strongly Agree'];
    // let question_type_data = {};
   
    
    
    var x = d3.scaleBand()
    .range([ 0, width ])
    .domain(likertToAgree)
    .padding(0.05);

    var y = d3.scaleBand()
        .range([ height, 0 ])
        .domain(unique_vals)
        .padding(0.05);
        
    var color = d3.scaleSequential()
        .interpolator(d3.interpolateGreens)
        .domain([0, 1]);

    
        
    let count = 0;
   
    Object.entries(question_type_data).forEach(([key, values])=> {
            
            var tooltip = d3.select("#dataviz")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px")
            var mouseover = function(event, d) {
                tooltip
                    .style("opacity", 1)
                d3.select(this)
                    .style("stroke", "black")
                    .style("opacity", 1)
                }
            var mousemove = function(event, d) {
                console.log(d3.pointer(event)[0])
                tooltip
                    .html(value + " : " + d[value] +"<br>likertscale : " + likertToAgree[d.likertscale - 1] +"<br>exact percentage: "+ Math.round(d[value+'_per'] * 100) / 100)
                    .style("left", (d3.pointer(event)[0]) + "px")
                    .style("top", (d3.pointer(event)[1])+ "px")
            }
            var mouseleave = function(event, d) {
                tooltip
                    .style("opacity", 0)
                d3.select(this)
                    .style("stroke", "none")
                    .style("opacity", 0.8)
            }
            count += 1;
            if (key !== "Attention_Question") {
                let svg = currGroup.append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                        .append("g")
                        .attr("transform",
                                "translate(" + margin.left + "," + margin.top + ")")
                        .attr("class", 'vis' + count);
                svg.append("g")
                            .style("font-size", 13)
                            .attr("transform", "translate(0," + height + ")")
                            .call(d3.axisBottom(x).tickSize(0))
                            .select(".domain").remove();
                svg.append("g")
                            .style("font-size", 13)
                            .call(d3.axisLeft(y).tickSize(0))
                            .select(".domain").remove()
               
                
                let heat = svg.selectAll('rect.vis' + count)
                .data(values).enter()
                .append("rect")
                
                heat
                .transition()
                .duration(1000)
                .attr("x", function(d, i) {
                    return x(likertToAgree[d.likertscale - 1])})
                .attr("y", function(d) {
                    return y(d[value])})
                .attr("rx", 4)
                .attr("ry", 4)
                .attr("width", x.bandwidth() )
                .attr("height", y.bandwidth() )
                .style("fill", (d, idx) => { 
                    return color(d[value + '_per'])} )
                .style("stroke-width", 4)
                .style("stroke", "none")
                .style("opacity", 0.8);
                
                heat.on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseleave);

                svg.append("text")
                .attr("x", 0)
                .attr("y", -50)
                .attr("text-anchor", "left")
                .style("font-size", "22px")
                .text(key);
                svg.append("text")
                .attr("x", 0)
                .attr("y", -20)
                .attr("text-anchor", "left")
                .style("font-size", "14px")
                .style("fill", "grey")
                .style("max-width", 400)
                .text(values[0].name);
            }
        })
}

function brushed({selection}) {

	// TO-DO: React to 'brushed' event
    areachart.x.domain(
        !selection ? timeline.x.domain() : selection.map(timeline.x.invert)
    );
    areachart.wrangleData();
}

