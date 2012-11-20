# Jinja template filters

from jinja2 import Markup, escape
import re


# Construct image URL from Photo object
def flickr_src(photo):
    return 'http://farm%(farm)s.staticflickr.com/%(server)s/%(id)s_%(secret)s.jpg' % photo


# Convert new lines to line breaks
def line_breaks(string):
    result = u'\n\n'.join(u'%s' % p.replace('\n', ' <br>\n')
        for p in re.compile(r'(?:\r\n|\r|\n){2,}').split(escape(string)))

    return Markup(result).unescape()


jinja_filters = {
    'flickr_src': flickr_src,
    'line_breaks': line_breaks,
}
