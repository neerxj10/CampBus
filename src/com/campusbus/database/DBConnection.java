package com.campusbus.database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;

// JDBC with MySQL Concept
public class DBConnection {
    private static final String URL = "jdbc:mysql://localhost:3306/campusbus";
    private static final String USER = "root";
    private static final String PASS = "Root@12345";

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASS);
    }

    public static void logBusEntry(String busId, String gate, String direction) {
        String query = "INSERT INTO bus_logs (bus_id, gate, direction, scan_time) VALUES (?, ?, ?, NOW())";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            
            stmt.setString(1, busId);
            stmt.setString(2, gate);
            stmt.setString(3, direction);
            stmt.executeUpdate();
            
            System.out.println("Database Updated: " + busId + " scanned " + direction + " at " + gate);
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
