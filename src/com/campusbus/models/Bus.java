package com.campusbus.models;

public class Bus {
    private String busId;
    private String driverName;
    private String route;
    private boolean insideCampus;

    public Bus(String busId, String driverName, String route) {
        this.busId = busId;
        this.driverName = driverName;
        this.route = route;
        this.insideCampus = false;
    }

    public String getBusId() { return busId; }
    public String getDriverName() { return driverName; }
    public boolean isInsideCampus() { return insideCampus; }
    
    public void setInsideCampus(boolean inside) {
        this.insideCampus = inside;
    }

    // Polymorphism / Overriding
    @Override
    public String toString() {
        return "Bus [ID=" + busId + ", Driver=" + driverName + ", Status=" + (insideCampus ? "IN" : "OUT") + "]";
    }
}
