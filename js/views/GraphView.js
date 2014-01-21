/* jshint jquery:true, devel: true */
/* global isomatic, d3, Backbone, _ */

(function(isomatic) {
    "use strict";

    /**
     * Graph View
     *
     * @type {*|void|Object}
     */
    isomatic.views.GraphView = Backbone.View.extend( /** @lends GraphView.prototype */ {

        /**
         * @class GraphView
         *
         * @augments Backbone.View
         * @contructs
         */
        initialize: function(){

            // Cache jQuery Selectors
            this.$display = $('#display');

            this.render();

            this.newVisualisation();

        },

        /**
         * Render Graph Element
         * Fill in just an empty graph div
         */
        render: function(){
            this.$el.html('<div id="graph"></div>');
        },

        /**
         * Manage Events
         */
        events: {
            "click #graph": "graphClick"
        },

        /**
         * If the graph is clicked, close all Overlays
         */
        graphClick: function() {
            window.location = '#home';
        },

        /**
         * Creates a new Visualisation
         * Calculats Graph Canvas Size and sets UI Options and Appearance accordingly
         */
        newVisualisation: function() {

            console.log('GraphView.newVisualisation();');

            var aspectRatio = parseFloat(isomatic.options.ui.get('aspectRatio'));
            var width = this.$display.width();
            var height = Math.round(width / aspectRatio);

            // Calculate Width and Height from Aspect Ratio
            isomatic.options.ui.set({
                graphWidth: width,
                graphHeight: height
            });

            // Sets height of the Drawing Area according to aspect ratio
            this.$display.height(height);

        },

        /**
         * Precalculates the visual Layout. Recommends some options like Icon-Size.
         * Stores the data into the isomatic.data.meta Model
         */
        precalculate: function() {

            console.log('GraphView.precalculate();');


            ////////////////////////////////////
            // Get & Parse Variables          //
            ////////////////////////////////////

            var iconHorizontalMargin = parseFloat(isomatic.options.ui.attributes.iconHorizontalMargin);
            var outerMargin          = parseFloat(isomatic.options.ui.attributes.outerMargin);
            var graphHeight          = parseInt(isomatic.options.ui.attributes.graphHeight, 10);
            var graphWidth           = parseInt(isomatic.options.ui.attributes.graphWidth, 10);
            var legendWidth          = parseInt(isomatic.options.ui.attributes.legendWidth, 10);
            var defaultIconSize      = isomatic.options.internal.defaultIconSize;

            var iconsPerRow          = [];


            ////////////////////////////////////
            // Calculations                   //
            ////////////////////////////////////


            for (var i = 0; i < isomatic.data.processed.length; i++) {

                var obj = isomatic.data.processed[i];

                if (!iconsPerRow[obj.row]) {
                    iconsPerRow[obj.row] = 1;
                } else {
                    iconsPerRow[obj.row] += 1;
                }
            }

            var maxIconsPerRow = d3.max(iconsPerRow);

            // Calculate Base Scale for Icons depending on biggest Row. (Fit to width)
            var widthLeft = graphWidth - (maxIconsPerRow * iconHorizontalMargin) - 2 * outerMargin - legendWidth;
            var baseScale = widthLeft / (maxIconsPerRow * 32);
            var iconSize  = baseScale * defaultIconSize;

            isomatic.data.meta.set({
                iconsPerRow: iconsPerRow,
                maxIconsPerRow: maxIconsPerRow,
                baseScale: baseScale
            });

            isomatic.options.ui.set({iconSize: iconSize});
        },

        /**
         * Calculates the Layout and stores it into isomatic.data.processed
         *
         * Constructs a new isotypeLayout, applies current Options and calculates the Layout
         */
        layout: function() {

            // Set Layouting Options

            this.isotypeLayout = new d3.layout.isotype();

            var roundDown = parseFloat(isomatic.options.ui.get("roundDown"));
            var roundUp = parseFloat(isomatic.options.ui.get("roundUp"));

            // If Round Size is disabled, set both to 0.5 to deactivate this feature
            if (!isomatic.options.ui.attributes.roundSize) {
                roundDown = 0.5;
                roundUp = 0.5;
            }

            this.isotypeLayout
                .roundDown(roundDown)
                .roundUp(roundUp)
                .scale(parseFloat(isomatic.options.ui.get("scale")))
            ;

            isomatic.data.processed = this.isotypeLayout(isomatic.data.raw.get('data'));

        },

        /**
         * Prepares the Drawing
         * Creates and prepares SVG Canvas
         * Creates and prepares the Isotype Layout
         */
        prepareDrawing: function() {

            console.log('GraphView.prepareDrawing();');


            ////////////////////////////////////
            // Get & Parse Variables          //
            ////////////////////////////////////

            var graphHeight = parseInt(isomatic.options.ui.attributes.graphHeight, 10);
            var graphWidth  = parseInt(isomatic.options.ui.attributes.graphWidth, 10);
            var iconMap     = isomatic.options.ui.attributes.iconMap;
            var colorMap    = isomatic.options.ui.attributes.colorMap;

            // Used for Calculations
            var diff        = 0;
            var maxSize     = Math.max(isomatic.data.meta.attributes.columns.length, isomatic.data.meta.attributes.rows.length);


            ////////////////////////////////////
            // Prepare Graph Container        //
            ////////////////////////////////////


            // Empty Canvas before Drawing
            $('#graph').html('');

            // Create new SVG Container for D3.js
            this.svg = d3.select("#graph").append("svg")
                .attr("width", parseInt(isomatic.options.ui.attributes.graphWidth, 10))
                .attr("height", parseInt(isomatic.options.ui.attributes.graphHeight, 10))
                .append("g")
                .attr("id", "isotype")
            ;


            //////////////////////////////////////
            // Adjust ColorMap and IconMap Size //
            //////////////////////////////////////

            // Check if ColorMap and IconMap are big enough for current Dataset.
            // If not, fill them up with default Values


            // Adjust ColorMap
            diff = maxSize - colorMap.length;
            if (diff > 0) {
                console.log('ColorMap misses ' + diff + 'Colors');
                for (var i = 0; i < diff; i++) {
                    colorMap.push(isomatic.options.internal.defaultColor);
                }
            }
            isomatic.options.ui.set({colorMap: colorMap});

            // Adjust IconMap
            diff = maxSize - iconMap.length;
            if (diff > 0) {
                console.log('IconMap misses ' + diff + 'Icons');
                for (var j = 0; j < diff; j++) {
                    iconMap.push(isomatic.options.internal.defaultIcon);
                }
            }
            isomatic.options.ui.set({iconMap: iconMap});

        },

        /**
         * Draws Isotype Graphic
         *
         * TODO: Line Return if overflowing on the right side
         */
        drawIsotype: function() {

            console.log('GraphView.drawIsotype();');


            ////////////////////////////////////
            // Get & Parse Variables          //
            ////////////////////////////////////

            var iconHorizontalMargin = parseFloat(isomatic.options.ui.attributes.iconHorizontalMargin);
            var outerMargin          = parseFloat(isomatic.options.ui.attributes.outerMargin);
            var rowMargin            = parseFloat(isomatic.options.ui.attributes.rowMargin);
            var graphHeight          = parseInt(isomatic.options.ui.attributes.graphHeight, 10);
            var graphWidth           = parseInt(isomatic.options.ui.attributes.graphWidth, 10);
            var legendWidth          = parseInt(isomatic.options.ui.attributes.legendWidth, 10);
            var baseScale            = parseFloat(isomatic.data.meta.attributes.baseScale);
            var defaultIconSize      = isomatic.options.internal.defaultIconSize;
            var legendTitleHeight    = parseInt(isomatic.options.ui.attributes.legendTitleHeight, 10);

            var iconize              = isomatic.options.ui.attributes.iconize;
            var colorize             = isomatic.options.ui.attributes.colorize;
            var iconMap              = isomatic.options.ui.attributes.iconMap;
            var colorMap             = isomatic.options.ui.attributes.colorMap;



            ////////////////////////////////////
            // Calculations                   //
            ////////////////////////////////////

            var iconSize = baseScale * defaultIconSize;


            ////////////////////////////////////
            // Draw Graphic via D3.js         //
            ////////////////////////////////////

            var g = this.svg.selectAll(".icon")

                .data(isomatic.data.processed)
                .enter()
                    .append("g")
                    .attr("class", "icon")
                    .attr("transform", function(d) {

                        var x = d.pos * (iconSize + iconHorizontalMargin) + outerMargin + legendWidth;
                        var y = d.row * (iconSize + rowMargin) + outerMargin;

                        // If legendTitleHeight > 0, draw Header Title
                        if (legendTitleHeight > 0) {
                            y += legendTitleHeight + outerMargin;
                        }

                        var scale = baseScale * d.size;

                        // If Icon is drawn smaller than full-size, center it
                        if (d.size < 1) {
                            x += (iconSize / 2) * (1 - d.size);
                            y += (iconSize / 2) * (1 - d.size);
                        }

                        // If Icon is drawn outside of Canvas give a warning
                        if (y > graphHeight || x > graphWidth) {
                            console.warn('<strong>Warning: </strong>The generated Graphic is bigger than its Canvas!');
                        }

                        return 'translate(' + x + ', ' + y + ') scale(' + scale + ')';

                    })
                    .html(function(d) {

                        var iconId, svg;

                        if (iconize === 'row') {
                            iconId = iconMap[d.row].split('-');
                            svg = isomatic.icons[iconId[0]].icons[iconId[1]].svg;
                        } else {
                            iconId = iconMap[d.col - 1].split('-');
                            svg = isomatic.icons[iconId[0]].icons[iconId[1]].svg;
                        }

                        return svg;
                    })
                    .attr("fill", function(d) {
                        if (colorize === 'row') {
                            return '#' + colorMap[d.row];
                        } else {
                            return '#' + colorMap[d.col - 1];
                        }
                    })
            ;

        },

        /**
         * Draws Legend Overlay
         * TODO: Not completely implemented yet
         */
        drawLegend: function() {

            console.log('GraphView.drawLegend();');


            ////////////////////////////////////
            // Get & Parse Variables          //
            ////////////////////////////////////

            var scale              = parseInt(isomatic.options.ui.attributes.scale, 10);
            var legendWidth        = parseInt(isomatic.options.ui.attributes.legendWidth, 10);
            var rowMargin          = parseFloat(isomatic.options.ui.attributes.rowMargin);
            var outerMargin        = parseFloat(isomatic.options.ui.attributes.outerMargin);
            var graphHeight        = parseInt(isomatic.options.ui.attributes.graphHeight, 10);
            var graphWidth         = parseInt(isomatic.options.ui.attributes.graphWidth, 10);
            var iconSize           = parseFloat(isomatic.options.ui.attributes.iconSize);
            var defaultIconSize      = isomatic.options.internal.defaultIconSize;

            var legendTitleHeight      = parseInt(isomatic.options.ui.attributes.legendTitleHeight, 10);
            var rowsLegendFontSize = parseInt(isomatic.options.ui.attributes.rowsLegendFontSize, 10);

            var iconize            = isomatic.options.ui.attributes.iconize;
            var colorize           = isomatic.options.ui.attributes.colorize;
            var iconMap            = isomatic.options.ui.attributes.iconMap;
            var colorMap           = isomatic.options.ui.attributes.colorMap;

            var legendFont         = isomatic.options.ui.attributes.legendFont;


            var columnLegendHeight = isomatic.options.internal.columnLegendHeight;


            ////////////////////////////////////
            // Calculations                   //
            ////////////////////////////////////

            var scaleText = '1 : ' + this.printScale(scale);


            ////////////////////////////////////
            // Legend: Title                  //
            ////////////////////////////////////

            if (legendTitleHeight > 0) {

                var title = this.svg.append("g")
                    .attr("class", "legend-heading")
                    .style("text-anchor", "start")
                    .attr("transform", "translate(" + outerMargin + ", " + (outerMargin + legendTitleHeight/2) + ")")
                ;

                title.append("text")
                    .attr("class", "legend")
                    .text(isomatic.data.meta.attributes.title)
                    .attr("fill", "#000")
                    .attr("font-family", legendFont)
                    .attr("font-size", legendTitleHeight + "px")
                ;
            }


            ////////////////////////////////////
            // Legend: Scale                  //
            ////////////////////////////////////

            var scaleLegend = this.svg.append("g")
                .attr("class", "legend-scale")
                .style("text-anchor", "end")
                .attr("transform", "translate(" + (graphWidth - outerMargin) + ", " + (graphHeight - outerMargin) + ")")
            ;

            scaleLegend.append("text")
                .attr("x", 0)
                .attr("y", -3) // TODO: Hard coded Layout Fix
                .attr("class", "legend")
                .text(scaleText)
                .attr("font-family", legendFont)
                .attr("fill", "#999999")
            ;


            ////////////////////////////////////
            // Legend: Rows                   //
            ////////////////////////////////////

            var rowsLegend = this.svg.append("g")
                .attr("class", "row-legend")
                .attr("width", legendWidth)
                .attr("height", 25)
                .selectAll("g")
                .data(isomatic.data.meta.attributes.rows)
                .enter()
                .append("g")
                .attr("transform", function(d, i) {

                    var y = i * (iconSize + rowMargin) + outerMargin;

                    if (legendTitleHeight > 0) {
                        y += legendTitleHeight + outerMargin;
                    }

                    return "translate(0," + y + ")";
                })
            ;

            rowsLegend.append("text")
                .attr("x", outerMargin)
                .attr("y", iconSize / 2)
                .attr("dy", ".35em")
                .attr("font-size", "14px")
                .attr("font-family", legendFont)
                .text(function(d) { return d; })
            ;


            ////////////////////////////////////
            // Legend: Columns                //
            ////////////////////////////////////

            if (!isomatic.options.ui.attributes.drawColumnLegend) {

                // Dont draw any Column Legend
                console.log('Not drawing Column Legend');


            } else if (colorize !== 'column' && iconize !== 'column') {

                // No Column Mapping!
                // User did not assign the Column to either Color or Icon
                // => Can't generate a Column Legend without Mapping

                var noColumnLegend = this.svg.append("g")
                        .attr("class", "no-column-legend")
                        .style("text-anchor", "start")
                        .attr("transform", "translate(" + outerMargin + ", " + (graphHeight - outerMargin) + ")")
                    ;

                noColumnLegend.append("text")
                    .attr("x", 0)
                    .attr("y", -3) // TODO: Hard coded Layout Fix
                    .attr("class", "legend")
                    .text("Warning: No Mapping for the Columns!")
                    .attr("font-family", legendFont)
                    .attr("fill", "#999999")
                ;

            } else {

                // Column Mapping available

                var columnsLegend = this.svg.append("g")
                        .attr("class", "column-legend")
                        .attr("width", legendWidth)
                        .attr("height", columnLegendHeight)
                        .selectAll("g")
                        .data(isomatic.data.meta.attributes.columns)
                        .enter()
                        .append("g")
                        .attr("transform", function(d, i) {
                            var x = i * (legendWidth + columnLegendHeight) + outerMargin ;
                            var y = (graphHeight - outerMargin - columnLegendHeight);
                            return "translate(" + x + "," + y + ")";
                        })
                    ;

                if (colorize === 'column') {
                    columnsLegend.append("rect")
                        .attr("class", "column-legend-color")
                        .attr("width", columnLegendHeight)
                        .attr("height", columnLegendHeight)
                        .style("fill", function(d, i) { return '#' + colorMap[i]; })
                    ;
                }

                if (iconize === 'column') {

                    columnsLegend.append("g")
                        .attr("class", "column-legend-icon")
                        .attr("width", columnLegendHeight)
                        .attr("height", columnLegendHeight)
                        .attr("transform", function(d) {

                            var scale = columnLegendHeight / defaultIconSize;

                            return 'scale(' + scale + ')';

                        })
                        .html(function(d, i) {

                            var iconId = iconMap[i].split('-');
                            var svg = isomatic.icons[iconId[0]].icons[iconId[1]].svg;

                            return svg;
                        })
                        .style("fill", function(d, i) { return '#000000'; })
                    ;
                }

                columnsLegend.append("text")
                    .attr("x", columnLegendHeight + 5)
                    .attr("y", columnLegendHeight / 2)
                    .attr("dy", ".35em")
                    .attr("font-size", "12px")
                    .attr("font-family", legendFont)
                    .attr("fill", "#999999")
                    .text(function(d) { return d; })
                ;
            }

        },

        ///////////////////////////////////
        // Helper Functions              //
        ///////////////////////////////////

        /**
         * Pretty prints the Scale (for use with the Legend and the UI)
         *
         * http://stackoverflow.com/a/2901298/776425
         *
         * @param   {Number}   scale     Scale to "prettify"
         * @returns {String}
         */
        printScale: function(scale) {
            return scale.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

    });

}(isomatic));

