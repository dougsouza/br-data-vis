// VISUALIZATION CONTROL
var slider_num = document.getElementById("slider-value");
var slider = document.getElementById("timeline-slider");
var state_name = document.getElementById("details-state-name");
var current_state = "";

slider.addEventListener("input", function() {
    slider_num.innerHTML = slider.value;
    update_map(slider.value);
    update_details(state_name.innerHTML, current_state, slider.value);
});
// ---------------


// MAP VISUALIZATION
var legenda = [];
var map = new Datamap({
    element: document.getElementById('map-container'),
    geographyConfig: {
        dataUrl: '/br-atlas/topo/br-states.json',
        highlightBorderColor: '#ccc',
        popupTemplate: function(geography, data) {
            return '<div class="hoverinfo">' + geography.properties.name + '<br /> Número de bolsas: ' +  data.numberOfScholarships + ' ';
        },
        highlightBorderWidth: 2
    },
    scope: 'states',
    setProjection: function(element, options) {
        var projection, path;
        projection = d3.geo.mercator()
                    .scale(800)
                    .translate([1200, 150]);
        path = d3.geo.path().projection( projection );

        return {path: path, projection: projection};
    },
    fills: {
        defaultFill: '#FADBD8',
        Low: '#F5B7B1',
        Medium: '#F1948A',
        High: '#EC7063',
        Higher: '#E74C3C'
	},
    done: function(datamap) {
        datamap.svg.selectAll('.datamaps-subunit').on('click', function(geography) {
            update_details(geography.properties.name, geography.id, slider.value);
        });
    }
});

function quartile(data){
	// gera amostra
	var  amostra = [];
	for (var x in data){
		amostra.push(data[x].total);
	}
 
	// ordena
	amostra.sort(function( a , b ){
		return a-b;
	});
		
	var n = amostra.length;
		
	var q3 =Math.round(n *3 / 4) ;
	var q2 =Math.round(n / 2) -1;
	var q1 =Math.round(n / 4)-1;
 
	if (n<4) {
		q3 = n-1;
	}
	
	var quartis = [];  
	quartis.push({inicio : 1, fim : amostra[q1]});
	quartis.push({inicio : amostra[q1]+1, fim : amostra[q2]});
	quartis.push({inicio : amostra[q2]+1, fim : amostra[q3]});
	quartis.push({inicio : amostra[q3]+1, fim : amostra[amostra.length-1]});
 
	quartis = quartis.filter(function(value,index,self){
		return !(isNaN(value.inicio) || typeof(value.fim) =='undefined');
	});
	
	quartis = quartis.filter(function(value,index,self){
		if (index==0) return true; 
		return value.fim > quartis[index-1].fim;
	});
	
	if (quartis.length==0 && amostra.length!=0)
		quartis.push({inicio : 1, fim : amostra[amostra.length-1]});
	
    legenda = [];
	$.each(quartis,function(index,quartil){
		legenda.push('De ' + quartil.inicio + ' até ' + quartil.fim);
	});
		
	return quartis;
}

function update_map(year)
{
    var file_name = "br-data/bolsas_" + year + ".json";
    var coresQuartis = ['Low', 'Medium', 'High', 'Higher'];

    $.get(file_name, function(data) {
        var obj = {};

        //calcular os quartis para usar com as cores
        var quartis = quartile(data);
        var cor = 'defaultFill';

        for(var i=0; i < data.length; i++){

            $.each(quartis,function(index,quartil){
                cor = (data[i].total >= quartil.inicio && data[i].total <= quartil.fim) ? coresQuartis[index] : cor;
            });

            obj[data[i].key] = {numberOfScholarships: data[i].total, 'fillKey': cor};
        }

        // update map
        map.updateChoropleth(obj);
        $(".datamaps-legend").remove();
        map.legend({
            defaultFillName: 'Sem dados',
            labels: {
                Low: legenda[0],
                Medium: legenda[1],
                High: legenda[2],
                Higher: legenda[3],
            }
        });
    });
}
// ---------------


// DETAILS VISUALIZATION
function update_details(state, postal, year)
{
    // update state name
    state_name.innerHTML = state;
    current_state = postal;

    // load treemap data
    var file_name = "br-data/bolsas_" + year + ".json";
    d3.json(file_name, function(data) {
        for(var i=0; i<data.length; i++)
        {
            if(data[i].key == postal)
            {
                treemap_create(data[i]);
                break;
            }
        }
    });
}

/* TREEMAP VARIABLES */
var margin = {top:24, right:15, bottom:0, left:0},
    title_height = 36 + 16,
    width = $("#details-container").width() - 15,
    height = $("#details-container").height() * 0.95,
    format_number = d3.format(",d"),
    transitioning;

width = width - margin.left - margin.right;
height = height - margin.top - margin.bottom - title_height;
 
var x = d3.scale.linear()
    .domain([0, width])
    .range([0, width]);

var y = d3.scale.linear()
    .domain([0, height])
    .range([0, height]);

var root_name = "TOP",
    treemap_title = "Scholarship Distribution",
    treemap_color = d3.scale.category20c();

var treemap = d3.layout.treemap()
    .children(function(d, depth) { return depth ? null : d._children; })
    .sort(function(a, b) { return a.value - b.value; })
    .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
    .round(false);

var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.bottom + margin.top)
    .style("margin-left", -margin.left + "px")
    .style("margin.right", -margin.right + "px")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .style("shape-rendering", "crispEdges");

var grandparent = svg.append("g")
    .attr("class", "grandparent");

grandparent.append("rect")
    .attr("y", -margin.top)
    .attr("width", width)
    .attr("height", margin.top);

grandparent.append("text")
    .attr("x", 6)
    .attr("y", 6 - margin.top)
    .attr("dy", ".75em");


/* ZOOMABLE TREEMAP IMPLEMENTATION */
function treemap_create(root)
{
    treemap_initialize(root, width, height);
    treemap_accumulate(root);
    treemap_layout(treemap, root);
    treemap_display(root);
    //console.log(root);
}

function treemap_initialize(root)
{
    root.x = root.y = 0;
    root.dx = width;
    root.dy = height;
    root.depth = 0;
}

// Aggregate the values for internal nodes. This is normally done by the
// treemap layout, but not here because of our custom implementation.
// We also take a snapshot of the original children (_children) to avoid
// the children being overwritten when when layout is computed.
function treemap_accumulate(d)
{
    return (d._children = d.values)
    ? d.value = d.values.reduce(function(p, v) { return p + treemap_accumulate(v); }, 0)
    : d.value;
}

// Compute the treemap layout recursively such that each group of siblings
// uses the same size (1×1) rather than the dimensions of the parent cell.
// This optimizes the layout for the current zoom state. Note that a wrapper
// object is created for the parent node for each group of siblings so that
// the parent’s dimensions are not discarded as we recurse. Since each group
// of sibling was laid out in 1×1, we must rescale to fit using absolute
// coordinates. This lets us use a viewport to zoom.
function treemap_layout(treemap, d)
{
    if (d._children) {
        treemap.nodes({_children: d._children});
        d._children.forEach(function(c) {
            c.x = d.x + c.x * d.dx;
            c.y = d.y + c.y * d.dy;
            c.dx *= d.dx;
            c.dy *= d.dy;
            c.parent = d;
            treemap_layout(treemap, c);
        });
    }
}

function treemap_text(text)
{
    text.selectAll("tspan")
        .attr("x", function(d) { return x(d.x) + 6; })
    text.attr("x", function(d) { return x(d.x) + 6; })
        .attr("y", function(d) { return y(d.y) + 6; })
        .style("opacity", function(d) { return this.getComputedTextLength() < x(d.x + d.dx) - x(d.x) ? 1 : 0; });
}

function treemap_text2(text)
{
    text.attr("x", function(d) { return x(d.x + d.dx) - this.getComputedTextLength() - 6; })
        .attr("y", function(d) { return y(d.y + d.dy) - 6; })
        .style("opacity", function(d) { return this.getComputedTextLength() < x(d.x + d.dx) - x(d.x) ? 1 : 0; });
}

function treemap_rect(rect)
{
    rect.attr("x", function(d) { return x(d.x); })
        .attr("y", function(d) { return y(d.y); })
        .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
        .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); });
}

function treemap_name(d)
{
    return d.parent
        ? treemap_name(d.parent) + " / " + d.key + " (" + format_number(d.value) + ")"
        : d.key + " (" + format_number(d.value) + ")";
}

function treemap_update(file_name)
{
    var postal = "RS";
    d3.json(file_name, function(data) {
            for(var i=0; i<data.length; i++)
            {
                if(data[i].key == postal)
                {
                    break;
                }
            }
        });
}

function treemap_display(d)
{
    grandparent
        .datum(d.parent)
        .on("click", transition)
        .select("text")
        .text(treemap_name(d));

    var g1 = svg.insert("g", ".grandparent")
        .datum(d)
        .attr("class", "depth");

    var g = g1.selectAll("g")
        .data(d._children)
        .enter().append("g");

    g.filter(function(d) { return d._children; })
        .classed("children", true)
        .on("click", transition);

    var children = g.selectAll(".child")
        .data(function(d) { return d._children || [d]; })
        .enter().append("g");

    children.append("rect")
        .attr("class", "child")
        .call(treemap_rect)
        .append("title")
        .text(function(d) { return d.key + " (" + format_number(d.value) + ")"; });
    children.append("text")
        .attr("class", "ctext")
        .text(function(d) { return d.key; })
        .call(treemap_text2);

    g.append("rect")
        .attr("class", "parent")
        .call(treemap_rect);

    var t = g.append("text")
        .attr("class", "ptext")
        .attr("dy", ".75em")

    t.append("tspan")
        .text(function(d) { return d.key; });
    t.append("tspan")
        .attr("dy", "1.0em")
        .text(function(d) { return format_number(d.value); });
    t.call(treemap_text);

    g.selectAll("rect")
        .style("fill", function(d) { return treemap_color(d.key); });

    function transition(d)
    {
        if (transitioning || !d) return;
        transitioning = true;

        var g2 = treemap_display(d),
            t1 = g1.transition().duration(750),
            t2 = g2.transition().duration(750);

        // Update the domain only after entering new elements.
        x.domain([d.x, d.x + d.dx]);
        y.domain([d.y, d.y + d.dy]);

        // Enable anti-aliasing during the transition.
        svg.style("shape-rendering", null);

        // Draw child nodes on top of parent nodes.
        svg.selectAll(".depth").sort(function(a, b) { return a.depth - b.depth; });

        // Fade-in entering text.
        g2.selectAll("text").style("fill-opacity", 0);

        // Transition to the new view.
        t1.selectAll(".ptext").call(treemap_text).style("fill-opacity", 0);
        t1.selectAll(".ctext").call(treemap_text2).style("fill-opacity", 0);
        t2.selectAll(".ptext").call(treemap_text).style("fill-opacity", 1);
        t2.selectAll(".ctext").call(treemap_text2).style("fill-opacity", 1);
        t1.selectAll("rect").call(treemap_rect);
        t2.selectAll("rect").call(treemap_rect);

        // Remove the old node when the transition is finished.
        t1.remove().each("end", function() {
            svg.style("shape-rendering", "crispEdges");
            transitioning = false;
        });
    }

    return g;
}
// ---------------


// INITIALIZATION
update_map(slider.value);
slider_num.innerHTML = slider.value;
state_name.innerHTML = "Select a state for a detailed view";
// ---------------
