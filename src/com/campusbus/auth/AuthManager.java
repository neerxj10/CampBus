package com.campusbus.auth;

import java.util.HashMap;
import java.util.Map;

// Basic Authentication Service
public class AuthManager {
    // Stores username as key, and password as value
    private Map<String, String> users;
    // Stores username as key, and role as value
    private Map<String, String> roles;

    public AuthManager() {
        users = new HashMap<>();
        roles = new HashMap<>();
        
        // Mock data corresponding to the frontend simulation
        users.put("admin", "admin123");
        roles.put("admin", "Administrator");
        
        users.put("security", "sec123");
        roles.put("security", "Security Guard");
    }

    /**
     * Authenticates a user based on username and password.
     * @param username The entered username
     * @param password The entered password
     * @return true if credentials are correct, false otherwise
     */
    public boolean login(String username, String password) {
        if (users.containsKey(username)) {
            return users.get(username).equals(password);
        }
        return false;
    }

    /**
     * Gets the role of the user.
     * @param username The authenticated username
     * @return The role of the user, or "Unknown" if not found
     */
    public String getRole(String username) {
        return roles.getOrDefault(username, "Unknown");
    }
}
