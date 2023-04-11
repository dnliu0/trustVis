
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
const question_to_type = {
    'Credibility': 'I believe the visualization shows real data.',
    'Familiarity': 'I am familiar with the topic or data this visualization presents.',
    'Understanding': 'I understand what this visualization is trying to tell me.',
    'Future_Action': 'I would rely on the facts in this Visualization.',
    'Future_Action': 'I would feel confident using the information to make a decision.',
    'Motive (Narrative)': 'This is a Narrative Visualization (Telling a story or sharing something that happened)',
    'Motive (Descriptive)': 'This is a Descriptive Visualization (Sharing details about people, places, or things)',
    'Motive (Persuasive)': 'This is a Persuasive Visualization (Getting a point across or trying to convince the viewer)',
    'Motive (Expository)': 'This is an Expository Visualization (Explaining or informing about a particular topic)',
    'Motive (Creative)': 'This is a Creative Visualization (An artistic expression with data)',
    'Motive (Technical)': 'This is a Technical Visualization (Presenting specialized or scientific data)',
    'Attention_Question': "Please select 'Agree'.",
    'Attention_Question': "Please select 'Strongly Disagree'.", 
    'Attention_Question': "Please select 'Disagree'.",
    'Attention_Question': "Please select 'Strongly Agree'.", 
    'Attention_Question': "Please select 'Neither'."
}

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
        let unique_scale = Array.from(new Set(allData.map((item) => item.likertscale)));
        let unique_type = Array.from(new Set(allData.map((item) => item.vistype)));
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
        value = select.value;
        createPic(question_type_avg, question_type_pics);
        select.onchange = function(){
            d3.select("#dataviz").select("." + value).remove();
            value = this.value;
            
            if (this.value === 'question') {
                createPic(question_type_avg, question_type_pics);
            } else {
                
                let unique_vals = Array.from(new Set(allData.map((item) => item[value])));
                width = 700 - margin.left - margin.right;
                height = (60 * unique_vals.length) - margin.top - margin.bottom;
                likertToAgree = ['Strongly Disagree', 'Disagree', 'Nor', 'Agree', 'Strongly Agree']
                
                title.innerHTML= value;
                document.getElementById("dataviz").appendChild(title);
               
               
                var currGroup = d3.select("#dataviz").append("g").attr("class", value);
                
                var select_format = document.getElementById("format");
                if (select_format.value == 'heatmap') {
                    createHeatMap(allData, value, currGroup, question_type_data, unique_vals);
                } else if (select_format.value == 'box-plot') {
                    createBoxPlot(allData, value, currGroup, question_type_data, unique_vals);
                }
                
                select_format.onchange = function(){
                    d3.select("#dataviz").html("");
                    console.log(this.value)
                    let format_val = this.value;
                    currGroup = d3.select("#dataviz").append("g").attr("class", value);
                    if (format_val == 'heatmap') {
                        createHeatMap(allData, value, currGroup, question_type_data, unique_vals);
                    } else if (format_val == 'box-plot') {
                        createBoxPlot(allData, value, currGroup, question_type_data, unique_vals);
                    }
                }
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


function createPic(question_type_avg, question_type_pics) {
    var div = document.createElement("div");
    div.setAttribute("class", "question");
    Object.entries(question_type_pics).forEach(([key, values]) => {
        if(key !== "Attention_Question") {
            var title = document.createElement("h2");
            title.innerHTML= key;
            var sub_title = document.createElement("p");
            sub_title.innerHTML= question_to_type[key];
            div.appendChild(title);
            div.appendChild(sub_title);
            values.forEach(d => {
                var elem = document.createElement("img");
                elem.setAttribute("src", "data/" + d[0]);
                elem.setAttribute("height", "100");
                elem.setAttribute("alt", "vis");
                div.appendChild(elem);
            })
        }
        
    })
    document.getElementById("dataviz").appendChild(div);
}


function createVis(allData, value, currGroup, question_type_data, unique_vals) {
    let format_val;
    var select_format = document.getElementById("format");
    d3.select(currGroup).html("");
    select_format.onchange = function(){
        console.log(this.value)
        format_val = this.value;
        if (format_val == 'heatmap') {
            createHeatMap(allData, value, currGroup, question_type_data, unique_vals);
        } else {
            createBoxPlot(allData, value, currGroup, question_type_data, unique_vals);
        }
    }
}

function createBoxPlot(allData, value, currGroup, question_type_data, unique_vals) {
    let likertToAgree = ['Strongly Disagree', 'Disagree', 'Nor', 'Agree', 'Strongly Agree'];
    height = 300 - margin.top - margin.bottom;
    width = 1000 - margin.left - margin.right;
    var boxWidth = width / unique_vals.length - 10;
    Object.entries(question_type_data).forEach(([key, values]) => {
        console.log(key)
        var sumstat = Array.from(d3.group(question_type_data[key], d => d[value]))
        .map(d => {
            k = d[0]
            q1 = d3.quantile(d[1].map((g) => { 
                return g['likertscale'];}).sort(d3.ascending),.25)
            median = d3.quantile(d[1].map(function(g) { return g['likertscale'];}).sort(d3.ascending),.5)
            q3 = d3.quantile(d[1].map(function(g) { return g['likertscale'];}).sort(d3.ascending),.75)
            interQuantileRange = q3 - q1
            min = Math.min(...d[1].map(g => g['likertscale']))
            max = Math.max(...d[1].map(g => g['likertscale']))
            return({k: k, q1: q1, median: median, q3: q3, interQuantileRange: interQuantileRange, min: min, max: max});
        })
        let maxVal = Math.max(...allData.map(d => d['likertscale']));
        var x = d3.scaleBand()
            .range([ 0, width ])
            .domain(unique_vals)
            .padding(0.05);
        let svg = currGroup.append('svg').attr("width", width + margin.left + margin.right)
                            .attr("height", height + margin.top + margin.bottom)
                            .append('g')
                            .attr("transform",
                                "translate(" + margin.left + "," + margin.top + ")");

        svg.append("g")
            .attr("transform", "translate("+ 0 + ", " + height + ")")
            .call(d3.axisBottom(x));
        var y = d3.scaleLinear()
            .domain([0, 5])
            .range([height, 0]);
        svg.append("g")
            .call(d3.axisLeft(y));
        console.log(sumstat)
        svg
        .selectAll("vertLines")
        .data(sumstat)
        .enter()
        .append("line")
        .attr("x1", function(d){return( x(d.k) + boxWidth/2)})
        .attr("x2", function(d){return( x(d.k) + boxWidth/2)})
        .attr("y1", function(d){return(y(d.min))})
        .attr("y2", function(d){return(y(d.max))})
        .attr("stroke", "black")
        .style("width", 40)

        svg.selectAll("boxes")
            .data(sumstat)
            .enter()
            .append("rect")
                .attr("x", function(d){
                    return( x(d.k))})
                .attr("y", function(d){return(y(d.q3))})
                .attr("height", function(d){return(y(d.q1)-y(d.q3))})
                .attr("width", boxWidth )
                // .attr("stroke", "black")
                .style("fill", "#69b3a2");
        svg.selectAll("medianLines")
                .data(sumstat)
                .enter()
                .append("line")
                  .attr("x1", function(d){return(x(d.k)) })
                  .attr("x2", function(d){return(x(d.k)+boxWidth) })
                  .attr("y1", function(d){return(y(d.median))})
                  .attr("y2", function(d){return(y(d.median))})
                  .attr("stroke", "black")
                  .style("width", 80)
                  
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
        })
    

}

function createHeatMap(allData, value, currGroup, question_type_data, unique_vals) {
    let likertToAgree = ['Strongly Disagree', 'Disagree', 'Nor', 'Agree', 'Strongly Agree'];
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

