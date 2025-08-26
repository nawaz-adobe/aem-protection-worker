export default {
  /**
   * Check if the user is authenticated (logged in vs logged out)
   * @param {Request} request - The incoming request
   * @returns {boolean} - True if user is logged in, false if logged out
   */
  checkAuthentication(_request) {
    // Simple mock - always return false for now (all users logged out)
    // TODO: Implement actual authentication logic checking headers/cookies
    return false;
  },
}; 