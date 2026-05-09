package com.match.partner.openapi.user.Utils;

import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.http.javanet.NetHttpTransport;


import java.io.IOException;

public class OAuth2Utils {

    private static final String CLIENT_ID = "YOUR_CLIENT_ID";
    private static final String CLIENT_SECRET = "YOUR_CLIENT_SECRET";
    private static final String REFRESH_TOKEN = "YOUR_REFRESH_TOKEN";

    public static String refreshAccessToken() throws IOException {
        NetHttpTransport transport = new NetHttpTransport();


        GoogleCredential credential = new GoogleCredential.Builder()
            .setTransport(transport)
            .setClientSecrets(CLIENT_ID, CLIENT_SECRET)
            .build()
            .setRefreshToken(REFRESH_TOKEN);

        boolean success = credential.refreshToken();
        if (success) {
            return credential.getAccessToken();
        } else {
            throw new IOException("Failed to refresh access token");
        }
    }
}
