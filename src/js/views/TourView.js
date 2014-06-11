/* jshint jquery:true, devel: true */
/* global isomatic, d3, Backbone, _, Handlebars */

(function(isomatic) {
    "use strict";

    isomatic.views.TourView = Backbone.View.extend( /** @lends TourView.prototype */ {

        /**
         * @class TourView
         *
         * @augments Backbone.View
         * @contructs
         */
        initialize: function(){
            this.render();
        },

        /** Render Tour Modal View */
        render: function(){

            var source = $('#tour-template').html();
            var template = Handlebars.compile(source);
            var html = template();
            this.$el.html(html);
        },


        events: {
            'click [type="checkbox"]': "skipTour",
            "click #start-tour": "startTour",
            "click #close-tour": "closeTour"
        },

        /**
         * Applies the currently calculated Aspect Ratio to the Graphic Canvas
         */

        skipTour: function() {
            if ($.getCookie('tour-viewed') === false || $.getCookie('tour-viewed') === "false") {
                $.createCookie('tour-viewed', "true", 365);
            } else {
                $.createCookie('tour-viewed', "false", 365);
            }
        },

        startTour: function() {
            $('#tour-modal').foundation('reveal', 'close');
        },

        closeTour: function() {
            $('#tour-modal').foundation('reveal', 'close');
        }


    });

}(isomatic));

