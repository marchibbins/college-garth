# Jinja template filters


# Get previous page number
def pagination_prev(value):
    return int(value) - 1


# Get next page number
def pagination_next(value):
    return int(value) + 1


jinja_filters = {
    'pagination_prev': pagination_prev,
    'pagination_next': pagination_next,
}
