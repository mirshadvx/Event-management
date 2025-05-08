from rest_framework.pagination import PageNumberPagination

class OrganizedListPagination(PageNumberPagination):
    page_size = 8
    page_size_query_param = 'limit'
    max_page_size = 100