package com.banking.domain.enums;

public enum Role {
    ADMIN, CUSTOMER, ROLE_ADMIN, ROLE_CUSTOMER;

    public String getAuthority() {
        return this.name().startsWith("ROLE_") ? this.name() : "ROLE_" + this.name();
    }
}
