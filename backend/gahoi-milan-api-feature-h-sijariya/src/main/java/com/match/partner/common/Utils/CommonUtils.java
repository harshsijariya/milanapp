package com.match.partner.common.Utils;

import org.springframework.stereotype.Component;

@Component
public class CommonUtils {

    public String convertToJMFormat(int number) {
        return String.format("JM%05d", number);
    }

    public int convertFromJMFormat(String jmCode) {
        if (jmCode != null && jmCode.startsWith("JM")) {
            try {
                return Integer.parseInt(jmCode.substring(2));
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Invalid JM code format: " + jmCode);
            }
        } else {
            throw new IllegalArgumentException("Invalid JM code format: " + jmCode);
        }
    }

    /**
     * Normalise a person's name for storage: "HARSH  sijariya" -> "Harsh Sijariya".
     *
     * Delegates to NameFormatter. UserProfile also normalises its own name in a
     * JPA lifecycle callback, so every save path is covered whether or not the
     * caller remembers to use this.
     */
    public String toDisplayName(String raw) {
        return NameFormatter.toDisplayName(raw);
    }

}
