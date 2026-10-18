package com.campusbus.gui;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import com.campusbus.auth.AuthManager;
import com.campusbus.database.DBConnection;
import java.sql.SQLException;

public class Dashboard extends JFrame {
    private AuthManager authManager;

    public Dashboard() {
        authManager = new AuthManager();
        
        setTitle("CampBus Backend Server Console");
        setSize(500, 350);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        
        initUI();
    }
    
    private void initUI() {
        JPanel panel = new JPanel();
        panel.setLayout(new BorderLayout(10, 10));
        panel.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        
        JLabel titleLabel = new JLabel("CampBus Server Status", SwingConstants.CENTER);
        titleLabel.setFont(new Font("Arial", Font.BOLD, 18));
        panel.add(titleLabel, BorderLayout.NORTH);
        
        JTextArea logArea = new JTextArea("Server initialized...\nGate threads started (Main Gate, Back Gate).\n");
        logArea.setEditable(false);
        logArea.setFont(new Font("Monospaced", Font.PLAIN, 12));
        panel.add(new JScrollPane(logArea), BorderLayout.CENTER);
        
        JButton testDbButton = new JButton("Test Database Connection");
        testDbButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                logArea.append("Attempting to connect to MySQL database...\n");
                try {
                    DBConnection.getConnection();
                    logArea.append("SUCCESS: Connected to campusbus database.\n");
                } catch (SQLException ex) {
                    logArea.append("ERROR: Failed to connect. Is MySQL running? (" + ex.getMessage() + ")\n");
                }
            }
        });
        
        panel.add(testDbButton, BorderLayout.SOUTH);
        
        add(panel);
    }
}
