(function () {

    // Setup namespace
    var CGRK = CGRK || {};

    // Dog entries
    CGRK.dogs = (function() {

        var init = function() {
            // Hide dogs and show loader
            $('.dogs .dog').addClass('hidden');

            var progress = '<div class="progress progress-striped active"><div class="bar"></div></div>';
            $('.dogs-title').after(progress);

            // Update images when loaded
            $('.dogs').imagesLoaded(function() {
                $('.dogs .progress').remove();
                CGRK.dogs.update();
            });

            // Remove static pagination (for infinite scroll)
            $('.dogs .pagination').remove();
        };

        var update = function() {
            var minHeight = 232;

            $('.dog').each(function() {
                var dog = $(this),
                    image = $('.dog-image', dog),
                    imageWidth = image.width(),
                    imageHeight = image.height();

                if (imageHeight < minHeight) {
                    var imageRatio = imageWidth/imageHeight;
                    imageHeight = minHeight;
                    imageWidth = imageHeight * imageRatio;
                };

                image.hide().after('<div class="js-dog-image"></div>');
                var jsImage = $('.js-dog-image', this).css({
                    'height': minHeight,
                    'background': 'url("' + image.attr('src') + '") center center',
                    'background-size': imageWidth + 'px ' + imageHeight + 'px'
                });

                dog.removeClass('hidden');
            });
        };

        return {
            init: init,
            update: update
        };

    })();

    // Main init
    $(function() {

        CGRK.dogs.init();

        $('[rel="external"]').click(function(event) {
            event.preventDefault();
            window.open(this.href);
        });

    });

})();