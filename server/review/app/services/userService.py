import grpc
from typing import List, Optional, Dict
from app.proto import user_pb2, user_pb2_grpc, common_pb2
from app.config import settings

class UserServiceClient:
    def __init__(self):
        self.channel = grpc.insecure_channel(
            f"{settings.userServiceGrpcHost}:{settings.userServiceGrpcPort}"
        )
        self.stub = user_pb2_grpc.UserServiceStub(self.channel)
    
    async def getUser(self, userId: str) -> Optional[Dict]:
        try:
            request = user_pb2.GetUserRequest(userId=userId)
            response = self.stub.GetUser(request)
            
            if response.status.code == common_pb2.Status.OK:
                user = response.user
                return {
                    "id": user.id,
                    "username": user.username,
                    "fullName": user.fullName,
                    "email": user.email,
                    "role": user.role,
                    "createdAt": user.createdAt
                }
            return None
        except grpc.RpcError as e:
            print(f"gRPC error: {e}")
            return None

    async def getUsers(self, userIds: List[str]) -> Dict[str, Dict]:
        try:
            request = user_pb2.GetUsersRequest(userIds=userIds)
            response = self.stub.GetUsers(request)
            
            result = {}
            if response.status.code == common_pb2.Status.OK:
                for user in response.users:
                    result[user.id] = {
                        "id": user.id,
                        "username": user.username,
                        "fullName": user.fullName,
                        "email": user.email,
                        "role": user.role, 
                        "createdAt": user.createdAt
                    }
            return result
        except grpc.RpcError as e:
            print(f"gRPC error: {e}")
            return {}

userServiceClient = UserServiceClient()