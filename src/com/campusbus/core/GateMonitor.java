package com.campusbus.core;

import com.campusbus.exceptions.InvalidBusException;

// Multithreading Concept (Runnable)
public class GateMonitor implements Runnable {
    private String gateName;
    private boolean isRunning;

    public GateMonitor(String gateName) {
        this.gateName = gateName;
        this.isRunning = true;
    }

    @Override
    public void run() {
        System.out.println("Starting monitor for: " + gateName);
        while (isRunning) {
            try {
                // Simulate continuous camera feed processing
                Thread.sleep(2000); 
                
                // Example logic to handle exceptions
                if (Math.random() > 0.95) {
                    throw new InvalidBusException("Unauthorized number plate detected at " + gateName);
                }
            } catch (InterruptedException e) {
                System.out.println(gateName + " monitor interrupted.");
                Thread.currentThread().interrupt();
            } catch (InvalidBusException e) {
                System.err.println("ALERT: " + e.getMessage());
            }
        }
    }

    public void stopMonitor() {
        this.isRunning = false;
    }
}
