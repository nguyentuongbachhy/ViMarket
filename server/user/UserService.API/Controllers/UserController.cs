using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserService.Core.Interfaces;
using System.Security.Claims;

namespace UserService.API.Controllers
{
    [Authorize]
    [Route("api/v1/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserRepository _userRepository;

        public UserController(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(string id)
        {
            var user = await _userRepository.GetUserByIdAsync(id);

            if (user == null)
                return NotFound("User not found");

            // Don't return sensitive data
            var userDto = new
            {
                id = user.Id,
                username = user.Username,
                email = user.Email,
                fullName = user.FullName,
                role = user.Role,
                createdAt = user.CreatedAt
            };

            return Ok(new
            {
                status = "success",
                data = userDto,
                message = "User retrieved successfully"
            });
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value))
                return Unauthorized("User ID claim is missing or invalid");

            var userId = userIdClaim.Value;

            var user = await _userRepository.GetUserByIdAsync(userId);

            if (user == null)
                return NotFound("User not found");

            // Don't return sensitive data
            var userDto = new
            {
                id = user.Id,
                username = user.Username,
                email = user.Email,
                fullName = user.FullName,
                role = user.Role,
                createdAt = user.CreatedAt
            };

            return Ok(new
            {
                status = "success",
                data = userDto,
                message = "User retrieved successfully"
            });
        }

        [Authorize(Roles = "admin")]
        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userRepository.GetAllUsersAsync();

            // Don't return sensitive data
            var userDtos = users.Select(user => new
            {
                id = user.Id,
                username = user.Username,
                email = user.Email,
                fullName = user.FullName,
                role = user.Role,
                createdAt = user.CreatedAt
            });

            return Ok(new
            {
                status = "success",
                data = userDtos,
                message = "Users retrieved successfully"
            });
        }
    }
}