using Grpc.Core;
using UserService.Core.Interfaces;
using Ecommerce.User;
using CommonStatus = Ecommerce.Common.Status; // Alias để tránh conflict

namespace UserService.API.Services
{
    public class UserGrpcService : Ecommerce.User.UserService.UserServiceBase
    {
        private readonly IUserRepository _userRepository;
        private readonly ILogger<UserGrpcService> _logger;

        public UserGrpcService(IUserRepository userRepository, ILogger<UserGrpcService> logger)
        {
            _userRepository = userRepository;
            _logger = logger;
        }

        public override async Task<GetUserResponse> GetUser(GetUserRequest request, ServerCallContext context)
        {
            try
            {
                _logger.LogInformation($"GetUser called with userId: {request.UserId}");

                if (string.IsNullOrEmpty(request.UserId))
                {
                    return new GetUserResponse
                    {
                        Status = new CommonStatus
                        {
                            Code = CommonStatus.Types.Code.InvalidArgument,
                            Message = "User ID is required"
                        }
                    };
                }

                var user = await _userRepository.GetUserByIdAsync(request.UserId);

                if (user == null)
                {
                    return new GetUserResponse
                    {
                        Status = new CommonStatus
                        {
                            Code = CommonStatus.Types.Code.NotFound,
                            Message = "User not found"
                        }
                    };
                }

                return new GetUserResponse
                {
                    Status = new CommonStatus
                    {
                        Code = CommonStatus.Types.Code.Ok,
                        Message = "Success"
                    },
                    User = new UserInfo
                    {
                        Id = user.Id,
                        Username = user.Username,
                        Email = user.Email,
                        FullName = user.FullName,
                        Role = user.Role,
                        CreatedAt = user.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                    }
                };
            }
            catch (KeyNotFoundException)
            {
                _logger.LogWarning($"User not found: {request.UserId}");
                return new GetUserResponse
                {
                    Status = new CommonStatus
                    {
                        Code = CommonStatus.Types.Code.NotFound,
                        Message = "User not found"
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting user: {request.UserId}");
                return new GetUserResponse
                {
                    Status = new CommonStatus
                    {
                        Code = CommonStatus.Types.Code.Error,
                        Message = "Internal server error"
                    }
                };
            }
        }

        public override async Task<GetUsersResponse> GetUsers(GetUsersRequest request, ServerCallContext context)
        {
            try
            {
                _logger.LogInformation($"GetUsers called with {request.UserIds.Count} user IDs");

                var response = new GetUsersResponse
                {
                    Status = new CommonStatus
                    {
                        Code = CommonStatus.Types.Code.Ok,
                        Message = "Success"
                    }
                };

                if (!request.UserIds.Any())
                {
                    return response;
                }

                foreach (var userId in request.UserIds)
                {
                    try
                    {
                        var user = await _userRepository.GetUserByIdAsync(userId);
                        if (user != null)
                        {
                            response.Users.Add(new UserInfo
                            {
                                Id = user.Id,
                                Username = user.Username,
                                Email = user.Email,
                                FullName = user.FullName,
                                Role = user.Role,
                                CreatedAt = user.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                            });
                        }
                    }
                    catch (KeyNotFoundException)
                    {
                        _logger.LogWarning($"User not found in batch: {userId}");
                        // Continue processing other users
                    }
                }

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users");
                return new GetUsersResponse
                {
                    Status = new CommonStatus
                    {
                        Code = CommonStatus.Types.Code.Error,
                        Message = "Internal server error"
                    }
                };
            }
        }
    }
}