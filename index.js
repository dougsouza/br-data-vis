// timeline control
var slider_num = document.getElementById("slider-value");
var slider = document.getElementById("timeline-slider");

slider.addEventListener("input", function() {
    slider_num.innerHTML = slider.value;
    update_map(slider.value);
    console.log("slider value: " + slider.value);
});


// map visualization
function update_map(year)
{
    var file_name = "br-data/bolsas_pos_" + year + ".json";
    $.get(file_name, function(data) {
        var obj = {};
        for(var i=0; i < data.length; i++){
            obj[data[i].UF] = {numberOfScholarships: data[i].Total, 'fillKey': 'LOW'};
        }

        // update map
        map.updateChoropleth(obj);
    });
}

var map = new Datamap({
    element: document.getElementById('map-container'),
    geographyConfig: {
        dataUrl: '/br-atlas/topo/br-states.json',
        highlightBorderColor: '#bada55',
        popupTemplate: function(geography, data) {
            return '<div class="hoverinfo">' + geography.properties.name + '<br /> Número de bolsas: ' +  data.numberOfScholarships + ' ';
        },
        highlightBorderWidth: 2
    },
    scope: 'states',
    setProjection: function(element, options) {
        var projection, path;
        projection = d3.geo.mercator()
                    .scale(500)
                    .translate([960, 50]);
        path = d3.geo.path().projection( projection );

        return {path: path, projection: projection};
    },
    fills: {LOW: '#ff3456'},
    done: function(datamap) {
        datamap.svg.selectAll('.datamaps-subunit').on('click', function(geography) {
            state_name.innerHTML = geography.properties.name;
        });
    }
});


// details visualization
var state_name = document.getElementById("details-state-name");


// initialization
map.legend();
update_map(slider.value);
slider_num.innerHTML = slider.value;
state_name.innerHTML = "Select a state for a detailed view";
