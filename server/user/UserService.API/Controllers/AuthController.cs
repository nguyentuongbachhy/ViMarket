using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserService.Core.DTOs;
using UserService.Core.Interfaces;

namespace UserService.API.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IUserRepository _userRepository;
        private readonly ITokenService _tokenService;

        public AuthController(IAuthService authService, IUserRepository userRepository, ITokenService tokenService)
        {
            _authService = authService;
            _userRepository = userRepository;
            _tokenService = tokenService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto registerDto)
        {
            if (await _authService.UserExistsAsync(registerDto.Username))
                return BadRequest("Username is already taken");

            if (await _authService.EmailExistsAsync(registerDto.Email))
                return BadRequest("Email is already registered");

            var user = await _authService.RegisterAsync(registerDto);

            if (user == null)
                return BadRequest("Failed to register user");

            return Ok(new
            {
                status = "success",
                data = user,
                message = "User registered successfully"
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto loginDto)
        {
            var tokenDto = await _authService.LoginAsync(loginDto);

            if (tokenDto == null)
                return Unauthorized("Invalid username or password");

            return Ok(new
            {
                status = "success",
                data = tokenDto,
                message = "Login successful"
            });
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto changePasswordDto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value))
                return Unauthorized("User ID claim is missing or invalid");

            var userId = userIdClaim.Value;

            if (string.IsNullOrEmpty(changePasswordDto.CurrentPassword))
                return BadRequest("Current password is required");

            var result = await _authService.ChangePasswordAsync(
                userId,
                changePasswordDto.CurrentPassword,
                changePasswordDto.NewPassword
            );

            if (!result)
                return BadRequest("Failed to change password");

            return Ok(new
            {
                status = "success",
                message = "Password changed successfully"
            });
        }

        [Authorize]
        [HttpPost("refresh")]
        public async Task<IActionResult> RefreshToken()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value))
                return Unauthorized("User ID claim is missing or invalid");

            var userId = userIdClaim.Value;

            try
            {
                // Get user from database
                var user = await _userRepository.GetUserByIdAsync(userId);
                if (user == null)
                    return Unauthorized("User not found");

                // Generate new token
                var tokenDto = await _tokenService.CreateToken(user);

                return Ok(new
                {
                    status = "success",
                    data = tokenDto,
                    message = "Token refreshed successfully"
                });
            }
            catch (KeyNotFoundException)
            {
                return Unauthorized("User not found");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    status = "error",
                    message = "Failed to refresh token",
                    error = ex.Message
                });
            }
        }

        [Authorize]
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            // JWT tokens are stateless, so actual logout happens on the client
            // by removing the token. This endpoint exists for API completeness
            // and potential future token blacklisting.

            return Ok(new
            {
                status = "success",
                message = "Logged out successfully"
            });
        }
    }

    public class ChangePasswordDto
    {
        public string? CurrentPassword { get; set; }
        public required string NewPassword { get; set; }
    }
}