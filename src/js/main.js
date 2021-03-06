/* jshint jquery:true, devel: true */
/* global d3, Backbone, _, Handlebars */

///////////////////////////////////////////////////////
// isomatic                                          //
///////////////////////////////////////////////////////
// An Interactive Isotype Graphics Generator         //
// https://github.com/Fannon/isomatic                //
///////////////////////////////////////////////////////

///////////////////////////////////////
// Global Variables                  //
///////////////////////////////////////

/** Global namespace */
var isomatic = {};

(function(isomatic) {
    "use strict";

    /** Isomatic Version (semver) */
    isomatic.version = '0.2.0';

    /** Views namespace */
    isomatic.views = {};


    ///////////////////////////////////////
    // On DOM Ready                      //
    ///////////////////////////////////////

    $(function() {


        ///////////////////////////////////////
        // Init Application                  //
        ///////////////////////////////////////

        /**
         * Isomatic Views Container
         *
         * Initializes all Views
         *
         * @type {Object}
         */
        var views = isomatic.views;

        views.graphView       = new views.GraphView({el: $("#graph-container")});

        views.newView         = new views.NewView({el: $("#new-modal")});
        views.importView      = new views.ImportView({el: $("#import-modal")});
        views.exportView      = new views.ExportView({el: $("#export-modal")});
        views.examplesView    = new views.ExamplesView({el: $("#examples-modal")});
        views.tourView        = new views.TourView({el: $("#tour-modal")});

        views.dataView        = new views.DataView({el: $("#data-container")});
        views.typeView        = new views.TypeView({el: $("#type-container")});
        views.iconMapView     = new views.IconMapView({el: $("#icon-left-container")});
        views.iconLibraryView = new views.IconLibraryView({el: $("#icon-right-container")});
        views.colorView       = new views.ColorView({el: $("#color-container")});
        views.propertiesView  = new views.AdjustmentsView({el: $("#adjustments-container")});
        views.scaleView       = new views.ScaleView({el: $("#scale-container")});
        views.textView        = new views.TextView({el: $("#text-container")});

        views.helpView       = new views.HelpView({el: $("#help-container")});

        // Draw Example Data Set
        isomatic.refreshData();


        ///////////////////////////////////////
        // Init 3rd Party Plugins            //
        ///////////////////////////////////////

        // Init Foundation JavaScript
        $(document).foundation();

        // Register ugly Hack
        $('.trigger-ui').on('click', function(el) {
            isomatic.uglyHack(el.currentTarget);
        });

        // Register ugly Help Hack
        $('#trigger-help').on('click', function(el) {
            var id = el.currentTarget.id.split('-')[1];
            if (window.location.hash !== '#help' && id === "help" && isomatic.options.internal.HelpStatus.active === true) {
                isomatic.options.internal.HelpStatus.active = true;
            } else {
                isomatic.options.internal.HelpStatus.active = false;
            }
            isomatic.uglyHack(el.currentTarget, isomatic.options.internal.HelpStatus.location);
        });

        //  Start interactive Tour if not already seen
        if (!$.getCookie('tour-viewed')) {
            window.location.hash = '#tour';
        }

        // Go to home if modal is closed:
        $(document).on('close.fndtn.reveal', '[data-reveal]', function () {
            window.location.hash = '#home';
        });

    });


    ///////////////////////////////////////
    // Backbone.Validation Config        //
    ///////////////////////////////////////

    // Register Backbone Model Validation
    _.extend(Backbone.Model.prototype, Backbone.Validation.mixin);

    // Register Callback Function on Validation Error
    // This manipulates the View DOM Items to indicate Validation Errors
    _.extend(Backbone.Validation.callbacks, {
        invalid: function(view, attr, error, selector) {
            console.warn('Validated:Invalid: ' + attr);
            $('input[name=' + attr + ']').addClass('invalid has-tip tip-right').attr('title', error).attr('data-tooltip', true);
        }
    });


    ///////////////////////////////////////
    // General Helper Functions          //
    ///////////////////////////////////////

    /**
     * Refreshes the Data and completely redraws the Graphic
     */
    isomatic.refreshData = function() {

        isomatic.views.dataView.analyze();

        // Refresh Layout
        isomatic.refreshLayout();

    };

    /**
     * Refreshes the Layout and the Design
     */
    isomatic.refreshLayout = function() {

        // Creates a new Visualsation
        isomatic.views.graphView.newVisualisation();

        // Calculates the layouted Data
        isomatic.views.graphView.layout();

        // Analyze the calculated Layout and save the informations into the Metadata Object.
        isomatic.views.graphView.preCalculate();

        // Refresh Design, too
        isomatic.refreshDesign();

    };

    /**
     * Redraws just the Design
     */
    isomatic.refreshDesign = function() {

        // Prepare Drawing
        isomatic.views.graphView.prepareDrawing();

        if (isomatic.options.ui.attributes.diagramType === 'normal') {
            // Draw Isotype Graphic
            isomatic.views.graphView.drawIsotype();

        } else if (isomatic.options.ui.attributes.diagramType === 'versus') {
            isomatic.views.graphView.drawAdvancedIsotype();

        } else if (isomatic.options.ui.attributes.diagramType === 'size') {
            isomatic.views.graphView.drawSizeIsotype();

        } else if (isomatic.options.ui.attributes.diagramType === 'compare') {
            // Draw Isotype Graphic
            isomatic.views.graphView.drawAdvancedIsotype();
        }

        // Draw Legend Overlay
        isomatic.views.graphView.drawLegend();

    };

    /**
     * Helper Function to register the Colorpicker with global default options
     * @param el
     */
    isomatic.registerColorpicker = function(el) {

        // Init: Set Border Color to current Input Valuef
        $(el).css('border-color','#'+ el[0].value);

        el.colpick({
            color: el[0].value,
            layout:'rgbhex',
            submit:0,
            colorScheme:'dark',

            onChange:function(hsb,hex,rgb,el,bySetColor) {
                $(el).css('border-color','#'+hex);
                // Fill the text box just if the color was set using the picker, and not the colpickSetColor function.
                if(!bySetColor) {
                    $(el).val(hex.toUpperCase());
                }
            }
        }).keyup(function(){
            $(this).colpickSetColor(this.value);
        });

    };

    /**
     * Returns a YYYY-MM-DD_-_HH-MM-SS formatted DateString
     * @return {String} formatted Date String
     */
    isomatic.getFormattedTime = function() {

        var a     = new Date();

        var year  = a.getFullYear();
        var month = isomatic.pad(a.getMonth() + 1);
        var date  = isomatic.pad(a.getDate());
        var hour  = isomatic.pad(a.getHours());
        var min   = isomatic.pad(a.getMinutes());
        var sec   = isomatic.pad(a.getSeconds());

        return year + '-' + month + '-' + date + '_-_' + hour + ':' + min + ':' + sec;
    };

    /**
     * Pads a Number
     * @param n             Number to Pad
     * @returns {string}    Padded Number
     */
    isomatic.pad = function(n) {
        return n < 10 ? '0' + n : n;
    };

    /**
     * If Toolbar Button is clicked when the target Overlay is already open: Close the Overlay instead
     *
     * @param el
     * @param destination
     */
    isomatic.uglyHack = function(el, destination) {
        var id = el.id.split('-')[1];
        if (!destination) {
            destination = 'home';
        }
        if (window.location.hash === '#' + id) {
            setTimeout(function() {
                window.location = '#' + destination;
            }, 50);
        }
    };


    ///////////////////////////////////////
    // 3rd Party Scripts                 //
    ///////////////////////////////////////

    /**
     * http://stackoverflow.com/a/4825695/776425
     *
     * @param name
     * @param value
     * @param days
     */
    $.createCookie = function(name, value, days) {
        var expires;
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toGMTString();
        }
        else {
            expires = "";
        }
        document.cookie = name + "=" + value + expires + "; path=/";
    };

    $.getCookie = function(name) {
        name = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0; i<ca.length; i++) {
            var c = ca[i].trim();
            if (c.indexOf(name) === 0) {
                var value =  c.substring(name.length, c.length);
                if (value === "false") {
                    return "false";
                } else {
                    return value;
                }
            }
        }
        return false;
    };

    /**
     * jQuery Plugin to allow File Downloads from JavaScript Variables
     * http://tutorialzine.com/2011/05/generating-files-javascript-php/
     */
    (function($) {

        // Creating a jQuery plugin:
        $.generateFile = function(options) {

            options = options || {};

            if (!options.script || !options.filename || !options.content) {
                throw new Error("Please enter all the required config options!");
            }

            // Creating a 1 by 1 px invisible iframe:

            var iframe = $('<iframe>', {
                width: 1,
                height: 1,
                frameborder: 0,
                css: {
                    display: 'none'
                }
            }).appendTo('body');

            var formHTML = '<form action="" method="post">' +
                '<input type="hidden" name="filename" />' +
                '<input type="hidden" name="content" />' +
                '</form>';

            // Giving IE a chance to build the DOM in
            // the iframe with a short timeout:

            setTimeout(function() {

                // The body element of the iframe document:

                var body = (iframe.prop('contentDocument') !== undefined) ?
                    iframe.prop('contentDocument').body :
                    iframe.prop('document').body;	// IE

                body = $(body);

                // Adding the form to the body:
                body.html(formHTML);

                var form = body.find('form');

                form.attr('action', options.script);
                form.find('input[name=filename]').val(options.filename);
                form.find('input[name=content]').val(options.content);

                // Submitting the form to download.php. This will
                // cause the file download dialog box to appear.

                form.submit();
            }, 50);
        };

    })(jQuery);

}(isomatic));


