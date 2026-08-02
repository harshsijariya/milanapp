package com.match.partner.common.configuration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;

import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Loads production configuration from AWS Secrets Manager.
 *
 * Runs before the application context exists, so the values are available to
 * every {@code ${PLACEHOLDER}} in application-prod.properties - including the
 * datasource URL, which Spring needs before any bean is created. A
 * {@code @Configuration} class would be far too late.
 *
 * Behaviour by environment:
 *   local  - the "prod" profile is not active, this does nothing, and
 *            application.properties supplies plain values as before
 *   server - reads one JSON secret and exposes each key as a property
 *
 * Precedence is deliberately LOW (addLast): a real environment variable on the
 * box still wins. That matters when something is broken at 2am and you need to
 * override a single value without editing a secret and waiting for propagation.
 *
 * Failure is fatal in production. Starting with a missing database password
 * would mean a running process serving 500s, which is harder to diagnose than
 * a service that refuses to start and says why.
 */
public class SecretsManagerEnvironmentPostProcessor implements EnvironmentPostProcessor {

    /** Overridable with SECRET_ID, so a staging box can point elsewhere. */
    private static final String DEFAULT_SECRET_ID = "gahoi-milan/prod";

    private static final String PROPERTY_SOURCE_NAME = "awsSecretsManager";

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        if (!isProduction(environment)) {
            return;
        }

        String secretId = environment.getProperty("SECRET_ID", DEFAULT_SECRET_ID);
        String region = environment.getProperty("AWS_REGION", "ap-south-1");

        // DefaultCredentialsProvider picks up the EC2 instance role from the
        // metadata service. No key is configured anywhere, which is the whole
        // point of using a role.
        try (SecretsManagerClient client = SecretsManagerClient.builder()
                .region(Region.of(region))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build()) {

            String payload = client.getSecretValue(
                    GetSecretValueRequest.builder().secretId(secretId).build()
            ).secretString();

            Map<String, Object> properties = flatten(payload);

            environment.getPropertySources()
                    .addLast(new MapPropertySource(PROPERTY_SOURCE_NAME, properties));

            // Key names only - never the values. This line ends up in the
            // journal, which is readable by anyone with shell access.
            System.out.println("[secrets] loaded " + properties.size()
                    + " keys from " + secretId + ": " + properties.keySet());

        } catch (Exception e) {
            throw new IllegalStateException(
                    "Could not read secret '" + secretId + "' from AWS Secrets Manager in "
                            + region + ". Check that the instance role grants "
                            + "secretsmanager:GetSecretValue on it.", e);
        }
    }

    /**
     * True when the prod profile is active.
     *
     * Reads the raw property rather than getActiveProfiles(), because at this
     * point in startup the profile may still be arriving from the command line
     * and calling getActiveProfiles() would freeze it prematurely.
     */
    private boolean isProduction(ConfigurableEnvironment environment) {
        String active = environment.getProperty("spring.profiles.active", "");
        for (String profile : active.split(",")) {
            if ("prod".equals(profile.trim())) {
                return true;
            }
        }
        return false;
    }

    /**
     * {"DB_PASSWORD":"x","JWT_SECRET":"y"} -> two properties.
     *
     * Only the top level is read. Nested objects would need a dotted-path
     * convention, and the flat shape keeps the secret readable in the console
     * where someone has to edit it by hand.
     */
    private Map<String, Object> flatten(String json) throws Exception {
        JsonNode root = objectMapper.readTree(json);
        Map<String, Object> properties = new LinkedHashMap<>();

        Iterator<Map.Entry<String, JsonNode>> fields = root.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> field = fields.next();
            JsonNode value = field.getValue();
            if (!value.isContainerNode()) {
                properties.put(field.getKey(), value.asText());
            }
        }

        return properties;
    }
}
