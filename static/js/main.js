(function () {

    // Setup namespace
    var CGRK = CGRK || {};

    // Dog entries
    CGRK.dogs = (function() {

        var init = function() {
            if ($('.dogs').length === 0) return;

            // Hide (non JS-enhanced..!) dogs
            $('.dogs .dog').parent().addClass('hidden');

            // Show loader
            var progress = '<div class="progress progress-striped active"><div class="bar"></div></div>';
            $('.dogs-title').after(progress);

            // Update images when loaded
            $('.dogs').imagesLoaded(function() {
                $('.dogs .progress').remove();
                CGRK.dogs.update();

                $('.dogs .pagination').show();
            });

            // Setup JS pagination
            paginate();
        };

        var update = function() {
            // Normalise heights
            var minHeight = 232;

            $('.dogs .dog:not(.js-dog)').each(function() {
                var dog = $(this),
                    image = $('.dog-image', dog),
                    imageWidth = image.width(),
                    imageHeight = image.height();

                // Can't guarantee nice sizes from Flickr
                if (imageHeight < minHeight) {
                    imageHeight = minHeight;
                    imageWidth = imageHeight * (imageWidth/imageHeight);
                };

                // Centered image background
                image.hide().after('<div class="js-dog-image"></div>');
                var jsImage = $('.js-dog-image', this).css({
                    'height': minHeight,
                    'background': 'url("' + image.attr('src') + '") center center',
                    'background-size': imageWidth + 'px ' + imageHeight + 'px'
                });

                // Show new dawg
                dog.addClass('js-dog').parent().removeClass('hidden');
            });
        };

        var paginate = function() {
            var pagination = $('.dogs .pagination').hide(),
                currentPage = parseInt(pagination.data().page),
                perPage = 6;

            // Remove static pagination (for infinite scroll)
            pagination.children().remove();

            // Load more button
            var more = '<div class="pagination-more"><a href="#">Load more dogs!</a></div>';
            pagination.append(more);

            // Request data
            var templateHTML = $('.dog-template').html();
            $('.pagination-more a').click(function(event) {
                event.preventDefault();

                var button = $(this).blur();
                if (!button.hasClass('disabled')) button.addClass('disabled').text('Loading');
                else return;

                // Load page
                $.ajax({
                    url: '/json/page/' + (currentPage + 1),
                    dataType: 'json',
                    statusCode: {
                        404: function() {
                            pagination.remove();
                        }
                    }
                })

                // Retry
                .fail(function(data) {
                    button.removeClass('disabled').text('Load more dogs!');
                })

                // Populate objects
                .done(function(data) {
                    var append = '',
                        count = 0;

                    $.each(data.photo, function(i, obj) {
                        var template = $(templateHTML),
                            name = obj.title.charAt(0).toUpperCase() + obj.title.slice(1),
                            image = 'http://farm' + obj.farm + '.staticflickr.com/' + obj.server + '/' + obj.id + '_' + obj.secret + '.jpg';

                        $('.dog-name', template).text(name);
                        $('.dog-image', template).attr('src', image);
                        template.addClass('hidden');
                        count++;

                        // Wrap rows
                        if (count === 1) append += '<div class="row-fluid">';
                        append += $('<div>').append(template.clone()).html();

                        if (count === 3) {
                            append += '</div>';
                            count = 0;
                        }
                    });

                    // Update images on load
                    pagination.before(append);
                    $('.dogs').imagesLoaded(function() {
                        CGRK.dogs.update();

                        // Increment page number
                        currentPage++;
                        pagination.attr('data-page', currentPage);

                        // Check for end of photoset
                        if (data.photo.length < perPage) {
                            pagination.remove();
                        } else {
                            button.removeClass('disabled').text('Load more dogs!');
                        }
                    });
                });
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

        // Open external link in new window
        $('[rel="external"]').click(function(event) {
            event.preventDefault();
            window.open(this.href);
        });

    });

})();