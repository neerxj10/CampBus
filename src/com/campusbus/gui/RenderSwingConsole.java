package com.campusbus.gui;

import java.awt.Dimension;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.File;
import javax.imageio.ImageIO;

public class RenderSwingConsole {
    public static void main(String[] args) {
        System.setProperty("java.awt.headless", "true");
        try {
            Dashboard d = new Dashboard();
            d.setSize(550, 400);
            d.doLayout();
            d.getContentPane().setSize(550, 400);
            d.getContentPane().doLayout();
            
            BufferedImage image = new BufferedImage(550, 400, BufferedImage.TYPE_INT_RGB);
            Graphics2D g2 = image.createGraphics();
            d.paint(g2);
            g2.dispose();
            
            File out = new File("CampBus_Report_Assets/figure12_swing_console.png");
            ImageIO.write(image, "png", out);
            System.out.println("Rendered Swing console to: " + out.getAbsolutePath());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
