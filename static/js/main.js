(function () {

    // Setup namespace
    var CGRK = CGRK || {};

    // Dog entries
    CGRK.dogs = (function() {

        var init = function() {
            if ($('.dogs').length === 0) return;

            // Legacy, boo!
            if ($.browser.msie && parseInt($.browser.version, 10) < 8) {
                $('.navbar').addClass('legacy');
            }

            // Update header and logo
            $(window).scroll(updateHeader);
            updateHeader();

            // Hide (non JS-enhanced..!) dogs
            $('.dogs .dog').parent().addClass('hidden');

            // Show loader
            var progress = '<div class="progress progress-striped active"><div class="bar"></div></div>';
            $('.dogs-title').after(progress);

            // Update images when loaded
            $('.dogs').imagesLoaded(function() {
                $('.dogs .progress').remove();
                CGRK.dogs.update();

                // Show pagiantion
                $('.dogs .pagination').show();
            });

            // Setup JS pagination
            paginate();

            // Check permalink
            permalink();

            // Page social
            Socialite.activate($('.header .facebook-like')[0], 'facebook-like');
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

                // Truncate description
                var description = $('.dog-description', this);
                var lines = description.html().split('<br>');
                if (lines.length > 2) {
                    var truncated = lines.slice(0, 2).join('<br>') + ' ...';
                    description.html(truncated);
                };

                // Share buttons
                var gplus = '<a class="socialite googleplus-share" href="" data-href="" data-action="share" data-annotation="bubble" rel="nofollow" target="_blank">Share on Google+</a>',
                    pinit = '<a class="socialite pinterest-pinit" href="" data-count-layout="horizontal" rel="nofollow" target="_blank">Pin It!</a>';

                $('.dog-share', dog).html(gplus + pinit);

                var abs_url = 'http://www.collegegarthrescuekennels.co.uk/#' + dog.data().id,
                    ghref = 'https://plus.google.com/share?url=' + encodeURIComponent(abs_url),
                    phref = 'http://pinterest.com/pin/create/button/?url=' + encodeURIComponent(abs_url) + '&amp;media=' + image.attr('src') + '&amp;description=' + encodeURIComponent(description.text());

                $('.googleplus-share', dog).attr('href', ghref).attr('data-href', abs_url);
                $('.pinterest-pinit', dog).attr('href', phref);

                // Permalink
                $('.js-dog-image, .dog-name, .dog-description', dog).click(function() {
                    CGRK.dogs.detail(dog);
                }).css('cursor', 'pointer');

                // Show new dawg
                dog.addClass('js-dog').parent().removeClass('hidden');
            });

            $('.googleplus-share:not(.socialite-instance)').each(function() {
                Socialite.activate(this, 'googleplus-share');
            });

            $('.pinterest-pinit:not(.socialite-instance)').each(function() {
                Socialite.activate(this, 'pinterest-pinit');
            });

            // Square up sizes
            $('.dogs .row-fluid').each(function() {
                var height = 0;
                $('.dog-info', this).each(function() {
                    height = Math.max(height, $(this).height())
                }).css('minHeight', height);
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
                        // Basic info
                        var template = CGRK.dogs.template(obj);
                        template.addClass('hidden');
                        count++;

                        // Wrap rows
                        if (count === 1) append += '<div class="row-fluid">';
                        append += $('<div>').append(template.clone()).html();

                        if (count === 3 || i === data.photo.length - 1) {
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

        var template = function(obj) {
            var templateHTML = $('.dog-template').html(),
                template = $(templateHTML),
                id = obj.id,
                name = obj.title.charAt(0).toUpperCase() + obj.title.slice(1),
                description = description_full = obj.description || '',

                // Make Flickr url
                image = 'http://farm' + obj.farm + '.staticflickr.com/' + obj.server + '/' + obj.id + '_' + obj.secret + '.jpg';

            // Truncate and clean description
            description_full = description_full.replace(/\n/g, '<br>');
            if (description.length > 75) {
                description = description.substring(0, 75).replace(/\n/g, '<br>') + ' ...';
            } else {
                description = description.replace(/\n/g, '<br>');
            }

            $('.dog', template).attr('data-id', id);
            $('.dog-name', template).text(name);
            $('.dog-description', template).html(description).attr('data-longdesc', description_full);
            $('.dog-image', template).attr('src', image);

            return template;
        };

        var updateHeader = function() {
            var logo = $('.title .logo'),
                home = $('.navbar .nav-home');

            if ($(window).scrollTop() >= 158) {
                logo.addClass('hide');
                home.removeClass('invisible').parent().removeClass('masked');
            } else {
                logo.removeClass('hide');
                home.addClass('invisible').parent().addClass('masked');
            }
        };

        var permalink = function() {
            // Setup modal
            var detail = $('#detail');
            detail.on('show', function() {
                detail.imagesLoaded(function() {
                    detail.css('margin-top', (detail.outerHeight() / 2) * -1)
                          .css('margin-left', (detail.outerWidth() / 2) * -1);
                });
            })
            .on('hide', function() {
                detail.find('.detail-image').attr('src', '');
                detail.find('.detail-info').html('');
                window.location.hash = '#home';
            });

            // Check initial URL
            var hash = parseInt(window.location.hash.substring(1));
            if (hash > 0) {
                var dog = $('.dog[data-id="' + hash + '"]');
                if (dog.length) {
                    CGRK.dogs.detail(dog);
                } else {
                    $.ajax({
                        url: '/json/photo/' + hash,
                        dataType: 'json'
                    })

                    .fail(function() {
                        window.location.hash = '#home';
                    })

                    .done(function(data) {
                        var template = CGRK.dogs.template(data),
                            dog = template.find('.dog');

                        CGRK.dogs.detail(dog);
                    });
                }
            }
        };

        var detail = function(dog) {
            var detail = $('#detail'),
                image = dog.find('.dog-image'),
                info = dog.find('.dog-info').html(),
                description_full = dog.find('.dog-description').data().longdesc;

            detail.find('.detail-image').attr('src', image.attr('src'));
            detail.find('.detail-info').html(info).find('.dog-share').remove();
            detail.find('.dog-description').html(description_full);

            detail.modal();
            window.location.hash = '#' + dog.data().id;
        }

        return {
            init: init,
            update: update,
            detail: detail,
            template: template
        };

    })();

    // Main init
    $(function() {

        CGRK.dogs.init();

        // Open external link in new window
        $('a[rel="external"]').click(function(event) {
            event.preventDefault();
            window.open(this.href);
        });

        // Smooth scrolling
        $('a.scrollTo').click(function(event) {
            var name = $(this).attr('href').split('#')[1];
            if (name) $(window).scrollTo($('#' + name), 500);
        });

    });

})();