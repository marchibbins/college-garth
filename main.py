import flickr_api
import jinja2
import os
import settings
import webapp2


class Index(webapp2.RequestHandler):
    def get(self):
        photoset = flickr_api.Photoset(id=settings.PHOTOSET_ID)
        data = {
            'photos': flickr_api.Photoset.getPhotos(photoset)
        }
        template = jinja_environment.get_template('index.html')
        self.response.out.write(template.render(data))


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

app = webapp2.WSGIApplication([('/', Index)], debug=True)
app.error_handlers[404] = handle_404
