from pychimp import PyChimp

from flickr_api.api import flickr
from flickr_api.method_call import clean_content

import flickr_api
import filters
import settings

import cgi
import jinja2
import json
import os
import webapp2


class Index(webapp2.RequestHandler):
    def get(self, page=None, api=False):
        # Check we're on our custom domain
        if os.environ['HTTP_HOST'].endswith('.appspot.com'):
            self.redirect(settings.DOMAIN)

        # Redirect for page number
        if not page:
            page = 1
        elif int(page) < 2:
            redirect_url = '/json/' if api else '/'
            return webapp2.redirect(redirect_url, abort=True)

        # Grab the data
        photoset = get_photoset(page)
        photos = get_photos(photoset)

        # Render template or JSON
        if api:
            self.response.headers['Content-Type'] = "application/json; charset=utf-8"
            self.response.out.write(json.dumps(photos))
        else:
            template = jinja_environment.get_template('index.html')
            self.response.out.write(template.render({'data': photos}))


class JSONIndex(Index):
    # Raw JSON for page
    def get(self, page=None):
        super(JSONIndex, self).get(page, True)


class JSONPhoto(webapp2.RequestHandler):
    def get(self, id=0):
        try:
            # Get photo
            photo = get_flickr_json('photo',
                        flickr.photos.getInfo(photo_id=id, format='json',
                            nojsoncallback=1))

            # Check photosets
            contexts = get_flickr_json('set',
                        flickr.photos.getAllContexts(photo_id=id, format='json',
                            nojsoncallback=1))

            # Photo should only be in one set, check ID
            id = int(contexts[0].get('id'))

            if id == settings.PHOTOSET_ID:
                photo['archive'] = False
            elif id == settings.PHOTOSET_ARCHIVE_ID:
                photo['archive'] = True
            else:
                raise
        except:
            # Go 404 if not found, e.g. photo not found
            webapp2.abort(404)

        # Write as JSON
        self.response.headers['Content-Type'] = "application/json; charset=utf-8"
        self.response.out.write(json.dumps(photo))


class Signup(webapp2.RequestHandler):
    def post(self):
        email = cgi.escape(self.request.get('email'))
        mailchimp = PyChimp(settings.MAILCHIMP_KEY)
        try:
            mailchimp.listSubscribe(settings.MAILCHIMP_LIST, email, {'FIRST': '', 'LAST': ''})
            self.redirect('/?subscribe=success')
        except:
            self.redirect('/?subscribe=failed')


def get_photoset(page):
    # Check cache first
    try:
        # Create JSON object from raw data, so we can cache it nicely
        photoset = get_flickr_json('photoset',
            flickr.photosets.getPhotos(photoset_id=settings.PHOTOSET_ID,
                page=page, per_page=6, format='json', nojsoncallback=1))

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
        try:
            # Replace photoset data with info object
            photo = get_flickr_json('photo',
                flickr.photos.getInfo(photo_id=id, format='json',
                    nojsoncallback=1))

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
    json_data = json.loads(data)[key]

    # Clean object with library
    return clean_content(json_data)


def handle_404(request, response, exception):
    # Simple handler for 404 template
    # template = jinja_environment.get_template('404.html')
    # response.write(template.render())
    # response.set_status(404)

    # Let's try sending strays home
    return webapp2.redirect('/', code=301)


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
    (r'/json/photo/(\d+)', JSONPhoto),

    # Newsletter signup
    (r'/signup', Signup),
]

# Debug based on local or production environment
DEBUG = os.environ['SERVER_SOFTWARE'].startswith('Dev')

# Application
app = webapp2.WSGIApplication(urls, debug=DEBUG)
app.error_handlers[404] = handle_404
