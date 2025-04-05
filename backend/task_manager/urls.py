from django.urls import path
from .views import (create_user, TokenRefresh, sign_in, sign_out,
                    is_authenticated, create_task, get_tasks, edit_task, delete_task)

urlpatterns = [
    path("add-user/", create_user, name="user-create"),
    path("sign-in/", sign_in, name="sign-in"),
    path("sign-out/", sign_out, name="sign_out"),
    path("authenticated/", is_authenticated, name="is-authenticated"),
    path("add-task/", create_task, name="task-create"),
    path("get-tasks/", get_tasks, name="get-tasks"),
    path("edit-task/<int:task_id>/", edit_task, name="edit-task"),
    path("delete-task/<int:task_id>/", delete_task, name="delete-task"),
    path("token/refresh/", TokenRefresh.as_view(), name="token_refresh"),
]
