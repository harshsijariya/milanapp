package com.match.partner.openapi.notification.service;

import com.match.partner.common.Utils.CommonUtils;
import com.match.partner.openapi.notification.model.NotificationType;
import com.match.partner.openapi.notification.model.dao.DeviceToken;
import com.match.partner.openapi.notification.model.dao.Notification;
import com.match.partner.openapi.notification.model.dto.BroadcastBody;
import com.match.partner.openapi.notification.model.dto.NotificationDto;
import com.match.partner.openapi.notification.repository.DeviceTokenRepository;
import com.match.partner.openapi.notification.repository.NotificationRepository;
import com.match.partner.openapi.user.model.dao.UserProfile;
import com.match.partner.openapi.user.repository.UserProfileRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationServiceInterface {

    private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);

    /** Topic every device subscribes to on launch, used for festival offers. */
    public static final String DEFAULT_TOPIC = "all-users";

    private final NotificationRepository notificationRepository;
    private final DeviceTokenRepository deviceTokenRepository;
    private final UserProfileRepository userProfileRepository;
    private final PushService pushService;
    private final CommonUtils commonUtils;

    private Integer userIdOf(String userName) {
        return userProfileRepository.findByEmail(userName)
                .map(UserProfile::getId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userName));
    }

    /**
     * Store the device's push token against the signed-in user.
     *
     * Upsert by token rather than insert, because FCM reissues the same token to
     * whichever account is now on the device. Reassigning the existing row stops
     * a previous owner from continuing to receive the new owner's pushes.
     */
    @Override
    @Transactional
    public void registerToken(String userName, String token, String platform) {
        if (token == null || token.isBlank()) return;

        Integer userId = userIdOf(userName);
        LocalDateTime now = LocalDateTime.now();

        DeviceToken row = deviceTokenRepository.findByToken(token).orElseGet(() -> {
            DeviceToken fresh = new DeviceToken();
            fresh.setToken(token);
            fresh.setCreatedAt(now);
            return fresh;
        });

        row.setUserId(userId);
        row.setPlatform(platform == null ? "android" : platform);
        row.setUpdatedAt(now);
        deviceTokenRepository.save(row);

        // Subscribe here rather than in the app: expo-notifications has no topic
        // API, and re-subscribing on every registration is idempotent, so this
        // also self-heals devices that missed an earlier subscribe.
        pushService.subscribeToTopic(token, DEFAULT_TOPIC);
    }

    @Override
    @Transactional
    public void unregisterToken(String token) {
        if (token == null || token.isBlank()) return;
        deviceTokenRepository.deleteByToken(token);
    }

    @Override
    public Page<NotificationDto> list(String userName, int page, int size) {
        Integer userId = userIdOf(userName);
        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
                .map(this::toDto);
    }

    @Override
    public long unreadCount(String userName) {
        return notificationRepository.countByUserIdAndReadAtIsNull(userIdOf(userName));
    }

    @Override
    @Transactional
    public void markAllRead(String userName) {
        notificationRepository.markAllRead(userIdOf(userName), LocalDateTime.now());
    }

    /**
     * Persist first, push second.
     *
     * The row is the source of truth for the in-app bell, so it must survive a
     * push failure. PushService is @Async and swallows its own errors, so a dead
     * token or an unreachable Firebase cannot roll back the caller's transaction.
     */
    @Override
    @Transactional
    public void notifyUser(Integer recipientId, NotificationType type, String title, String body, Integer actorId) {
        if (recipientId == null) return;

        Notification row = new Notification();
        row.setUserId(recipientId);
        row.setType(type);
        row.setTitle(title);
        row.setBody(body);
        row.setActorId(actorId);
        row.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(row);

        Map<String, String> data = new HashMap<>();
        data.put("type", type.name());
        if (actorId != null) {
            data.put("actorId", commonUtils.convertToJMFormat(actorId));
        }

        try {
            pushService.sendToUser(recipientId, title, body, data);
        } catch (Exception e) {
            log.warn("Push dispatch failed for user {}: {}", recipientId, e.getMessage());
        }
    }

    /**
     * Festival announcement.
     *
     * Sends to an FCM topic, so this is a single call regardless of user count -
     * the reason topics exist. Optionally also writes a feed row per user so the
     * announcement survives in the bell for anyone whose device was off.
     */
    @Override
    @Transactional
    public void broadcast(BroadcastBody body) {
        String topic = (body.getTopic() == null || body.getTopic().isBlank())
                ? DEFAULT_TOPIC
                : body.getTopic();

        Map<String, String> data = new HashMap<>();
        data.put("type", NotificationType.BROADCAST.name());
        if (body.getLink() != null) data.put("link", body.getLink());

        pushService.sendToTopic(topic, body.getTitle(), body.getBody(), data);

        if (body.isSaveToFeed()) {
            LocalDateTime now = LocalDateTime.now();
            List<UserProfile> all = userProfileRepository.findAll();
            List<Notification> rows = all.stream().map(user -> {
                Notification n = new Notification();
                n.setUserId(user.getId());
                n.setType(NotificationType.BROADCAST);
                n.setTitle(body.getTitle());
                n.setBody(body.getBody());
                n.setCreatedAt(now);
                return n;
            }).toList();
            notificationRepository.saveAll(rows);
            log.info("Broadcast written to {} feeds", rows.size());
        }
    }

    private NotificationDto toDto(Notification n) {
        NotificationDto dto = new NotificationDto();
        dto.setId(n.getId());
        dto.setType(n.getType().name());
        dto.setTitle(n.getTitle());
        dto.setBody(n.getBody());
        dto.setActorId(n.getActorId() == null ? null : commonUtils.convertToJMFormat(n.getActorId()));
        dto.setRead(n.getReadAt() != null);
        dto.setCreatedAt(n.getCreatedAt());
        return dto;
    }
}
