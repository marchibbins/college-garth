# Jinja template filters


# Construct image URL from Photo object
def flickr_src(photo):
    return 'http://farm%(farm)s.staticflickr.com/%(server)s/%(id)s_%(secret)s_m.jpg' % photo


jinja_filters = {
    'flickr_src': flickr_src,
}
