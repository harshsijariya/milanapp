package com.match.partner.common.service;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;

import java.net.URL;
import java.time.Duration;

@Service
public class S3ServiceImpl implements S3ServiceInterface {

    @Value("${aws.s3.bucket.name}")
    private String bucketName;

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    public S3ServiceImpl(@Value("${aws.access.key.id}") String accessKey,
                     @Value("${aws.secret.access.key}") String secretKey,
                     @Value("${aws.region}") String region) {
        AwsBasicCredentials awsCreds = AwsBasicCredentials.create(accessKey, secretKey);

        // Create the S3 client
        this.s3Client = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(awsCreds))
                .build();

        // Create the S3 presigner
        this.s3Presigner = S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(awsCreds))
                .build();
    }

    // Upload file to S3
    public String uploadFile(byte[] fileData, String fileName) {
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(fileName)
                .build();

        s3Client.putObject(putObjectRequest, RequestBody.fromBytes(fileData));

        return "s3://" + bucketName + "/" + fileName;
    }

    // Generate a signed URL for downloading the file
    public String generatePresignedUrl(String fileName) {
        // Create a GetObjectRequest
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(fileName)
                .build();

        // Presign the request using S3Presigner
        PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(p -> p
                .getObjectRequest(getObjectRequest)
                .signatureDuration(Duration.ofHours(1)) // 1 hour validity
        );

        // Generate the URL
        URL presignedUrl = presignedRequest.url();
        return presignedUrl.toString();
    }

    // Generate a signed URL for uploading the file
    public String generatePresignedUploadUrl(String fileName, String contentType) {
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(fileName)
                .contentType(contentType)
                .build();

        PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(p -> p
                .putObjectRequest(putObjectRequest)
                .signatureDuration(Duration.ofMinutes(15)) // 15 minutes validity
        );

        return presignedRequest.url().toString();
    }
}
