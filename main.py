import flickr_api
import jinja2
import os
import settings
import webapp2


class Index(webapp2.RequestHandler):
    def get(self, page=None):
        if page == '1':
            return webapp2.redirect('/')

        photoset = flickr_api.Photoset(id=settings.PHOTOSET_ID)
        photos = flickr_api.Photoset.getPhotos(photoset, page=page, per_page=2)

        template = jinja_environment.get_template('index.html')
        self.response.out.write(template.render({'photos': photos}))


def handle_404(request, response, exception):
    template = jinja_environment.get_template('404.html')
    response.write(template.render())
    response.set_status(404)

flickr_api.set_keys(
    api_key=settings.API_KEY,
    api_secret=settings.API_SECRET
)

jinja_environment = jinja2.Environment(
    loader=jinja2.FileSystemLoader(
        os.path.join(os.path.dirname(__file__), 'templates')
    )
)

urls = [
    ('/', Index),
    (r'/page/(\d+)', Index),
]

DEBUG = os.environ['SERVER_SOFTWARE'].startswith('Dev')

app = webapp2.WSGIApplication(urls, debug=DEBUG)
app.error_handlers[404] = handle_404
