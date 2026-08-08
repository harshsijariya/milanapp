package com.match.partner.openapi.user.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.match.partner.common.configuration.ClientException;
import com.match.partner.openapi.user.model.dao.UserProfile;
import com.match.partner.openapi.user.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * Birth chart generation, via the kundali Lambda.
 *
 * The app does not call the function directly, and should not be able to. Its
 * inputs are a person's exact birth date, time and place - about as identifying
 * as personal data gets - so it sits behind this authenticated endpoint, which
 * reads those values from the caller's own profile rather than accepting them
 * from the client. That also means a member cannot generate a chart for someone
 * else by passing different values.
 *
 * Nothing is cached. A chart is deterministic from three fields that rarely
 * change, so caching looks tempting, but people correct their birth time after
 * asking a parent, and a stale chart is worse than a slow one. The function
 * runs in well under a second and costs a fraction of a paisa per call.
 */
@Service
@RequiredArgsConstructor
public class KundaliService {

    private static final Logger log = LoggerFactory.getLogger(KundaliService.class);

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final UserProfileRepository userProfileRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${kundali.function-name:gahoi-milan-prod-kundali}")
    private String functionName;

    @Value("${kundali.enabled:true}")
    private boolean enabled;

    /**
     * Built lazily and kept, because creating a LambdaClient resolves
     * credentials and endpoints - work worth doing once rather than per
     * request. Null until first use so an app with the feature disabled, or one
     * running locally with no AWS credentials, never constructs one.
     */
    private volatile LambdaClient lambda;

    public JsonNode generateForUser(String userName) {
        if (!enabled) {
            throw new ClientException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Kundali generation is turned off on this server.");
        }

        UserProfile profile = userProfileRepository.findByEmail(userName)
                .orElseThrow(() -> new ClientException(HttpStatus.NOT_FOUND, "Profile not found"));

        LocalDateTime dob = profile.getDateOfBirth();
        String tob = profile.getTimeOfBirth();
        String pob = profile.getPlaceOfBirth();

        // Checked here rather than in the Lambda so the member gets a message
        // naming the field to fill in, instead of a 400 from a service they
        // have never heard of. Time is as required as date: an hour of error
        // moves the ascendant by roughly a whole sign, which changes every
        // house placement, so a chart built on a guess is confidently wrong.
        if (dob == null) {
            throw new ClientException(HttpStatus.BAD_REQUEST,
                    "Add your date of birth to your profile first.");
        }
        if (tob == null || tob.isBlank()) {
            throw new ClientException(HttpStatus.BAD_REQUEST,
                    "Add your time of birth to your profile first - a kundali cannot be "
                            + "calculated without it.");
        }
        if (pob == null || pob.isBlank()) {
            throw new ClientException(HttpStatus.BAD_REQUEST,
                    "Add your place of birth to your profile first.");
        }

        String payload;
        try {
            payload = objectMapper.writeValueAsString(Map.of(
                    "date", dob.format(DATE),
                    // The Lambda wants HH:MM. The column holds a SQL time, which
                    // arrives as HH:MM:SS.
                    "time", tob.length() >= 5 ? tob.substring(0, 5) : tob,
                    "place", pob
            ));
        } catch (Exception e) {
            throw new ClientException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not build the request");
        }

        InvokeResponse response;
        try {
            response = client().invoke(InvokeRequest.builder()
                    .functionName(functionName)
                    .payload(SdkBytes.fromUtf8String(payload))
                    .build());
        } catch (Exception e) {
            log.error("Could not invoke {}: {}", functionName, e.getMessage());
            throw new ClientException(HttpStatus.BAD_GATEWAY,
                    "Could not reach the chart service. Please try again.");
        }

        // Two distinct failures share one status code here. A Lambda that threw
        // sets FunctionError and puts the stack trace in the payload; a Lambda
        // that ran fine but returned a 4xx puts that in its own statusCode.
        // Both need unpicking or the member sees "success" with no chart.
        if (response.functionError() != null) {
            log.error("kundali raised: {}", response.payload().asUtf8String());
            throw new ClientException(HttpStatus.BAD_GATEWAY,
                    "The chart service failed. Please try again.");
        }

        JsonNode envelope;
        try {
            envelope = objectMapper.readTree(response.payload().asUtf8String());
        } catch (Exception e) {
            throw new ClientException(HttpStatus.BAD_GATEWAY, "The chart service returned nothing usable.");
        }

        int status = envelope.path("statusCode").asInt(200);
        JsonNode body;
        try {
            body = objectMapper.readTree(envelope.path("body").asText("{}"));
        } catch (Exception e) {
            throw new ClientException(HttpStatus.BAD_GATEWAY, "The chart service returned nothing usable.");
        }

        if (status != 200) {
            // The Lambda's own message is worth surfacing - "Unknown place
            // 'Foo'" tells the member exactly what to change.
            throw new ClientException(HttpStatus.BAD_REQUEST,
                    body.path("error").asText("The chart could not be generated."));
        }

        return body;
    }

    private LambdaClient client() {
        LambdaClient existing = lambda;
        if (existing != null) {
            return existing;
        }
        synchronized (this) {
            if (lambda == null) {
                // Region and credentials come from the environment: the EC2
                // instance role in production, the usual chain locally.
                lambda = LambdaClient.create();
            }
            return lambda;
        }
    }
}
