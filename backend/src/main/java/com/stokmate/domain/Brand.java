package com.stokmate.domain;

/**
 * Sample product brands shipped with the open-source seed data.
 * Replace these enum values (and the matching Flyway mapping) with your own catalog.
 */
public enum Brand {
    OAK("Oak"),
    PINE("Pine"),
    MAPLE("Maple");

    private final String displayName;

    Brand(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
