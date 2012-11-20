# Jinja template filters


# Construct image URL from Photo object
def flickr_src(photo, size=None):
    photo['size'] = '_%s' % size if size else ''
    return 'http://farm%(farm)s.staticflickr.com/%(server)s/%(id)s_%(secret)s%(size)s.jpg' % photo


jinja_filters = {
    'flickr_src': flickr_src,
}
