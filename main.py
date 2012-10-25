import jinja2
import os
import webapp2


class Index(webapp2.RequestHandler):
    def get(self):
        template = jinja_environment.get_template('index.html')
        self.response.out.write(template.render())


def handle_404(request, response, exception):
    template = jinja_environment.get_template('404.html')
    response.write(template.render())
    response.set_status(404)

jinja_environment = jinja2.Environment(
    loader=jinja2.FileSystemLoader(
        os.path.join(os.path.dirname(__file__), 'templates')
    )
)

app = webapp2.WSGIApplication([('/', Index)], debug=True)
app.error_handlers[404] = handle_404
