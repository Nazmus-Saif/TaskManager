from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import CreateTaskSerializer, AddUserSerializer, SignInSerializer
from .models import Tasks, Users
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.hashers import check_password, make_password
from rest_framework_simplejwt.views import TokenRefreshView


class TokenRefresh(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.COOKIES.get("refresh_token")
            if not refresh_token:
                raise ValueError("Refresh token not found in cookies.")

            request.data["refresh"] = refresh_token
            response = super().post(request, *args, **kwargs)
            access_token = response.data.get("access")

            res = Response(
                {"success": True, "message": "Token refreshed successfully."})
            res.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=True,
                samesite="None",
                max_age=3600 * 24,  # 1 day
                path="/",
            )
            return res
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Failed to refresh token. Error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_user(request):
    try:
        if request.user.is_superuser:
            serializer = AddUserSerializer(data=request.data)
            if serializer.is_valid():
                password = make_password(serializer.validated_data["password"])
                serializer.save(password=password)
                return Response({"message": "User created successfully.", "data": serializer.data}, status=status.HTTP_201_CREATED)
            else:
                return Response({"error": "Invalid data provided for user creation.", "details": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        if not request.user.permissions.get("create", False):
            return Response({"error": "You don't have permission to create a user."}, status=status.HTTP_403_FORBIDDEN)

        serializer = AddUserSerializer(data=request.data)
        if serializer.is_valid():
            password = make_password(serializer.validated_data["password"])
            serializer.save(password=password)
            return Response({"message": "User created successfully.", "data": serializer.data}, status=status.HTTP_201_CREATED)
        else:
            return Response({"error": "Invalid data provided for user creation.", "details": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({"error": f"Error creating user: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([AllowAny])
def sign_in(request):
    try:
        serializer = SignInSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"error": "Invalid login credentials.", "details": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data.get("email")
        password = serializer.validated_data.get("password")

        user = Users.objects.filter(email=email).first()
        if not user:
            return Response({"error": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)

        if check_password(password, user.password):
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            user_data = SignInSerializer(user).data

            res = Response({"message": "Login successful.",
                           "user_data": user_data}, status=status.HTTP_200_OK)
            res.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                samesite="None",
                secure=True,
                max_age=60,
                path="/",
            )
            res.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                samesite="None",
                secure=True,
                max_age=3600 * 24 * 7,
                path="/",
            )

            return res
        else:
            return Response({"error": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return Response({"error": f"Error during sign-in: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def sign_out(request):
    try:
        response = Response(
            {"message": "Signed out successfully!"}, status=status.HTTP_200_OK)
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        return response
    except Exception as e:
        return Response({"error": f"Error during sign-out: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def is_authenticated(request):
    try:
        access_token = request.COOKIES.get("access_token")
        if access_token:
            return Response({"success": True, "message": "User is authenticated."}, status=status.HTTP_200_OK)
        else:
            return Response({"success": False, "message": "User is not authenticated."}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return Response({"error": f"Error checking authentication status: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_task(request):
    try:
        assigned_user = Users.objects.filter(
            id=request.data.get("assigned_to")).first()
        if not assigned_user:
            return Response({"error": "Assigned user not found."}, status=status.HTTP_404_NOT_FOUND)

        request.data["assigned_by"] = request.user.id

        serializer = CreateTaskSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Task created successfully.", "task": serializer.data}, status=status.HTTP_201_CREATED)
        else:
            return Response({"error": "Invalid task data.", "details": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": f"Error creating task: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_tasks(request):
    try:
        tasks = Tasks.objects.filter(assigned_to=request.user.id)

        if not tasks.exists():
            return Response({"message": "No tasks found for this user."}, status=status.HTTP_404_NOT_FOUND)

        serializer = CreateTaskSerializer(tasks, many=True)
        return Response({"message": "Tasks retrieved successfully.", "tasks": serializer.data}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": f"Error fetching tasks: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def edit_task(request, task_id):
    try:
        task = Tasks.objects.filter(id=task_id).first()
        if not task:
            return Response({"error": "Task not found."}, status=status.HTTP_404_NOT_FOUND)

        allowed_fields = {"title", "description",
                          "priority", "deadline", "assigned_to"}
        non_editable_fields = {
            key: value for key, value in request.data.items() if key not in allowed_fields}

        if non_editable_fields:
            field_names = ', '.join(non_editable_fields.keys())
            return Response({"error": f"Fields {field_names} cannot be changed."}, status=status.HTTP_400_BAD_REQUEST)

        if "assigned_to" in request.data:
            assigned_user = Users.objects.filter(
                id=request.data["assigned_to"]).first()
            if not assigned_user:
                return Response({"error": "Assigned user not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = CreateTaskSerializer(
            task, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Task updated successfully.", "task": serializer.data}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid data for task update.", "details": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": f"Error updating task: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_task(request, task_id):
    try:
        task = Tasks.objects.filter(id=task_id).first()
        if task:
            task.delete()
            return Response({"message": "Task deleted successfully."}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Task not found."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": f"Error deleting task: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
