from google.appengine.api import memcache

from flickr_api.api import flickr
from flickr_api.method_call import clean_content
import flickr_api
import filters
import settings

import jinja2
import os
import simplejson
import webapp2


class Index(webapp2.RequestHandler):
    def get(self, page=None, json=False):
        # Redirect for page number
        if not page:
            page = 1
        elif int(page) < 2:
            redirect_url = '/json/' if json else '/'
            return webapp2.redirect(redirect_url, abort=True)

        # Grab the data
        photoset = get_photoset(page)
        photos = get_photos(photoset)

        # Render template or JSON
        if json:
            self.response.headers['Content-Type'] = "application/json; charset=utf-8"
            self.response.out.write(simplejson.dumps(photos))
        else:
            template = jinja_environment.get_template('index.html')
            self.response.out.write(template.render({'data': photos}))


class JSONIndex(Index):
    # Raw JSON for page
    def get(self, page=None):
        super(JSONIndex, self).get(page, True)


def get_photoset(page):
    # Check cache first
    cached = memcache.get('photoset:%s' % page)
    if cached is not None:
        return cached
    else:
        try:
            # Create JSON object from raw data, so we can cache it nicely
            photoset = get_flickr_json('photoset',
                flickr.photosets.getPhotos(photoset_id=settings.PHOTOSET_ID,
                    page=page, per_page=6, format='json', nojsoncallback=1))

            memcache.add('photoset:%s' % page, photoset, 300)
            return photoset
        except:
            # Go 404 if not found, e.g. page out of bounds
            webapp2.abort(404)


def get_photos(photoset):
    # Get full photo info per object
    photos = photoset.get('photo')
    for index, photo in enumerate(photos):
        id = photo.get('id')
        # Check cache first
        cached = memcache.get('photo:%s' % id)
        if cached is not None:
            photos[index] = cached
        else:
            try:
                # Replace photoset data with info object
                photo = get_flickr_json('photo',
                    flickr.photos.getInfo(photo_id=id, format='json',
                        nojsoncallback=1))

                memcache.add('photo:%s' % id, photo, 300)
                photos[index] = photo
            except:
                # Remove if unable
                del photos[index]

    # Remove any empty photo objects
    photoset['photo'] = filter(None, photos)
    return photoset


def get_flickr_json(key, data):
    # API returns raw JSON, including Flickr error codes
    # Using index directly will throw KeyError (then 404) if API doesn't find object
    json = simplejson.loads(data)[key]

    # Clean object with library
    return clean_content(json)


def handle_404(request, response, exception):
    # Simple handler for 404 template
    template = jinja_environment.get_template('404.html')
    response.write(template.render())
    response.set_status(404)


# Configuration
flickr_api.set_keys(
    api_key=settings.API_KEY,
    api_secret=settings.API_SECRET
)

jinja_environment = jinja2.Environment(
    loader=jinja2.FileSystemLoader(
        os.path.join(os.path.dirname(__file__), 'templates')
    )
)

jinja_environment.filters.update(filters.jinja_filters)

# Routes
urls = [
    # HTML views
    (r'/', Index),
    (r'/page/(\d+)', Index),

    # JSON views
    (r'/json/', JSONIndex),
    (r'/json/page/(\d+)', JSONIndex),
]

# Debug based on local or production environment
DEBUG = os.environ['SERVER_SOFTWARE'].startswith('Dev')

# Application
app = webapp2.WSGIApplication(urls, debug=DEBUG)
app.error_handlers[404] = handle_404
