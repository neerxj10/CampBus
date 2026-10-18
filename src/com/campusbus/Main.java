package com.campusbus;

import com.campusbus.core.GateMonitor;
import com.campusbus.gui.Dashboard;

public class Main {
    public static void main(String[] args) {
        System.out.println("Starting CampBus Backend System...");

        // Initialize and start Gate Monitor threads (Multithreading concept)
        GateMonitor mainGate = new GateMonitor("Main Gate");
        GateMonitor backGate = new GateMonitor("Back Gate");

        Thread t1 = new Thread(mainGate);
        Thread t2 = new Thread(backGate);

        t1.start();
        t2.start();

        // Start Local HTTP API Server to connect with HTML Dashboard
        com.campusbus.core.ApiServer.startServer();

        // Launch the Swing GUI
        javax.swing.SwingUtilities.invokeLater(() -> {
            Dashboard dashboard = new Dashboard();
            dashboard.setVisible(true);
        });
    }
}
