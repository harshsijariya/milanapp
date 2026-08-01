package com.match.partner.common.Utils;

import java.util.Set;

/**
 * Name normalisation, as static methods.
 *
 * Static rather than a Spring bean because UserProfile normalises its own name
 * from a JPA lifecycle callback, and entities cannot have dependencies injected.
 * CommonUtils delegates here so callers that already hold the bean keep working.
 */
public final class NameFormatter {

    private NameFormatter() {
    }

    private static final Set<String> PARTICLES = Set.of(
            "de", "da", "di", "van", "von", "bin", "ibn", "al", "el", "la", "le"
    );

    /**
     * "HARSH  sijariya" -> "Harsh Sijariya".
     *
     * Users type names in every case imaginable - ALL CAPS from a phone keyboard,
     * all lowercase from a hurried signup - and a profile list looks broken when
     * those sit side by side. Normalising on write means the database holds one
     * canonical form instead of every screen having to format defensively.
     *
     * Handles what a naive capitalise-first-letter gets wrong:
     *  - collapses repeated whitespace
     *  - capitalises after hyphens, apostrophes and dots ("Bal-Krishna", "D'Souza")
     *  - keeps name particles lowercase unless they open the name
     */
    public static String toDisplayName(String raw) {
        if (raw == null) return null;

        String cleaned = raw.trim().replaceAll("\\s+", " ");
        if (cleaned.isEmpty()) return cleaned;

        StringBuilder out = new StringBuilder(cleaned.length());
        String[] words = cleaned.split(" ");

        for (int i = 0; i < words.length; i++) {
            if (i > 0) out.append(' ');

            String word = words[i];
            if (i > 0 && PARTICLES.contains(word.toLowerCase())) {
                out.append(word.toLowerCase());
            } else {
                out.append(capitaliseSegments(word));
            }
        }

        return out.toString();
    }

    private static String capitaliseSegments(String word) {
        StringBuilder sb = new StringBuilder(word.length());
        boolean startOfSegment = true;

        for (char c : word.toCharArray()) {
            if (startOfSegment && Character.isLetter(c)) {
                sb.append(Character.toUpperCase(c));
                startOfSegment = false;
            } else {
                sb.append(Character.toLowerCase(c));
            }
            if (c == '-' || c == '\'' || c == '.') {
                startOfSegment = true;
            }
        }

        return sb.toString();
    }
}
