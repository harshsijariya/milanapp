package com.match.partner.openapi.user.service;

import com.match.partner.common.configuration.ClientException;
import com.match.partner.openapi.user.model.dao.Status;
import com.match.partner.openapi.user.model.dao.UserProfile;
import com.match.partner.openapi.user.repository.UserProfileRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Verifies a Google ID token and resolves it to a local user.
 *
 * Verification is delegated to Google's tokeninfo endpoint, which checks the
 * signature, issuer and expiry for us. We then additionally check the audience
 * ("aud") against our own client IDs - without that check a token minted for a
 * completely different app would be accepted here.
 */
@Service
public class GoogleIdTokenService {

    private static final String TOKENINFO_URL =
            "https://oauth2.googleapis.com/tokeninfo?id_token=";

    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Comma-separated list of every OAuth client ID that may sign in to this
     * backend (web + android + ios). Configured via google.oauth.client-ids.
     */
    @Value("${google.oauth.client-ids:}")
    private String allowedClientIds;

    public GoogleIdTokenService(UserProfileRepository userProfileRepository,
                               PasswordEncoder passwordEncoder) {
        this.userProfileRepository = userProfileRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserProfile verifyAndResolveUser(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new ClientException(HttpStatus.BAD_REQUEST, "idToken is required");
        }

        Map<String, Object> claims = fetchClaims(idToken);

        String email = asString(claims.get("email"));
        if (email == null || email.isBlank()) {
            throw new ClientException(HttpStatus.UNAUTHORIZED, "Google token has no email");
        }
        if (!"true".equalsIgnoreCase(asString(claims.get("email_verified")))) {
            throw new ClientException(HttpStatus.UNAUTHORIZED, "Google email is not verified");
        }
        verifyAudience(asString(claims.get("aud")));

        String name = asString(claims.get("name"));
        return findOrCreateUser(email, name);
    }

    private Map<String, Object> fetchClaims(String idToken) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> body = restTemplate.getForObject(TOKENINFO_URL + idToken, Map.class);
            if (body == null) {
                throw new ClientException(HttpStatus.UNAUTHORIZED, "Could not verify Google token");
            }
            return body;
        } catch (RestClientException e) {
            // Google returns 4xx for expired/tampered/unknown tokens.
            throw new ClientException(HttpStatus.UNAUTHORIZED, "Invalid or expired Google token");
        }
    }

    private void verifyAudience(String aud) {
        List<String> allowed = Arrays.stream(allowedClientIds.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());

        if (allowed.isEmpty()) {
            // Misconfiguration - fail closed rather than accept any audience.
            throw new ClientException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "google.oauth.client-ids is not configured on the server");
        }
        if (aud == null || !allowed.contains(aud)) {
            throw new ClientException(HttpStatus.UNAUTHORIZED,
                    "Google token was not issued for this application");
        }
    }

    /**
     * Google accounts have no local password. A random one is stored so the
     * NOT NULL column is satisfied and the account cannot be used with the
     * email/password login form.
     */
    private UserProfile findOrCreateUser(String email, String name) {
        Optional<UserProfile> existing = userProfileRepository.findByEmail(email);
        if (existing.isPresent()) {
            return existing.get();
        }

        UserProfile user = new UserProfile();
        user.setEmail(email);
        user.setName(name != null && !name.isBlank() ? name : email.split("@")[0]);
        user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setStatus(Status.PENDING);
        return userProfileRepository.save(user);
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }
}
