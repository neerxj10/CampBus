package com.campusbus.core;

import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import com.campusbus.database.DBConnection;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

public class ApiServer {
    public static void startServer() {
        try {
            HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
            server.createContext("/api/log", new LogHandler());
            server.setExecutor(null);
            server.start();
            System.out.println("API Server started on http://localhost:8080");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    static class LogHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            // Setup CORS to allow the HTML file to talk to Java
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "POST, OPTIONS");
            exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                InputStream is = exchange.getRequestBody();
                String body = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                
                // Very basic manual JSON parsing to avoid pulling in external libraries for this demo
                String busId = extractJsonField(body, "plateId");
                String direction = extractJsonField(body, "direction");
                String gate = extractJsonField(body, "gate");

                // Send to SQL Database
                System.out.println("Received API Request: " + busId + " -> " + direction + " at " + gate);
                try {
                    DBConnection.logBusEntry(busId, gate, direction);
                    String response = "{\"status\":\"success\"}";
                    exchange.sendResponseHeaders(200, response.getBytes().length);
                    OutputStream os = exchange.getResponseBody();
                    os.write(response.getBytes());
                    os.close();
                } catch (Exception e) {
                    e.printStackTrace();
                    String response = "{\"status\":\"error\"}";
                    exchange.sendResponseHeaders(500, response.getBytes().length);
                    OutputStream os = exchange.getResponseBody();
                    os.write(response.getBytes());
                    os.close();
                }
            }
        }

        private String extractJsonField(String json, String field) {
            String search = "\"" + field + "\":\"";
            int start = json.indexOf(search);
            if (start == -1) return "Unknown";
            start += search.length();
            int end = json.indexOf("\"", start);
            return json.substring(start, end);
        }
    }
}
