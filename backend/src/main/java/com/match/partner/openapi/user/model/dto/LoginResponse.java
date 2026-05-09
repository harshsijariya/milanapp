package com.match.partner.openapi.user.model.dto;

import jakarta.persistence.Entity;
import lombok.Data;

@Data
public class LoginResponse {
    private String token;
    private long expiresIn;
}