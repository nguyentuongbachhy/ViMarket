using UserService.Core.DTOs;
using UserService.Core.Entities;

namespace UserService.Core.Interfaces
{
    public interface ITokenService
    {
        Task<TokenDto> CreateToken(User user);
        string ValidateToken(string token);
    }
}